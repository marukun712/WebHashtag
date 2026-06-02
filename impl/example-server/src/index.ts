import { staticPlugin } from "@elysia/static";
import * as ed from "@noble/ed25519";
import { Elysia } from "elysia";
import { base58btc } from "multiformats/bases/base58";
import { z } from "zod";
import { addEntry, hasEntry } from "./db";
import { startRevalidation } from "./revalidate";
import { fetchOgp, verifyBacklink } from "./verify";

const SERVER_HOST = process.env.SERVER_HOST ?? "localhost:3000";
const SERVER_NAME = process.env.SERVER_NAME ?? "Example Tag Server";
const MODE = (process.env.MODE ?? "open") as "open" | "closed";

let secretKey: Uint8Array | null = null;
let publicKeyEncoded: string | null = null;

if (MODE === "closed") {
	const storedSecret = process.env.SECRET_KEY;
	const key = storedSecret
		? Buffer.from(storedSecret, "hex")
		: ed.utils.randomSecretKey();
	if (!storedSecret) {
		console.log(
			"Generated SECRET_KEY (set this as env var):",
			Buffer.from(key).toString("hex"),
		);
	}
	secretKey = key;
	// https://github.com/multiformats/js-multiformats
	publicKeyEncoded = base58btc.encode(ed.getPublicKey(key));
}

await Bun.write(
	"public/.well-known/webhashtag.json",
	JSON.stringify(
		{
			version: "0.1",
			name: SERVER_NAME,
			mode: MODE,
			publicKey: publicKeyEncoded,
		},
		null,
		2,
	),
);

startRevalidation(SERVER_HOST);

const tokenSchema = z.object({
	url: z.url(),
	tag: z.string(),
	server: z.string(),
	exp: z.iso.datetime(),
	sig: z.string(),
});

const app = new Elysia();

// https://elysiajs.com/plugins/static
app.use(await staticPlugin({ assets: "public", prefix: "" }));

app.get(
	"/tag/:tag",
	async ({ params, query, request, set }) => {
		const { tag } = params;
		const referer = request.headers.get("referer");

		if (!referer) {
			set.status = 400;
			return { error: "Referer header is required" };
		}

		let articleUrl: string;
		try {
			articleUrl = new URL(referer).href;
		} catch {
			set.status = 400;
			return { error: "Invalid Referer" };
		}

		if (MODE === "closed") {
			const { token } = query;
			if (!token) {
				set.status = 401;
				return { error: "Token is required" };
			}

			let rawJson: unknown;
			try {
				rawJson = JSON.parse(new TextDecoder().decode(base58btc.decode(token)));
			} catch {
				set.status = 400;
				return { error: "Invalid token format" };
			}

			const result = tokenSchema.safeParse(rawJson);
			if (!result.success) {
				set.status = 400;
				return { error: "Invalid token format" };
			}
			const parsed = result.data;

			if (new Date(parsed.exp) < new Date()) {
				set.status = 401;
				return { error: "Token expired" };
			}

			if (parsed.url !== articleUrl) {
				set.status = 401;
				return { error: "Token URL does not match Referer" };
			}

			const { sig, ...rest } = parsed;
			const message = new TextEncoder().encode(JSON.stringify(rest));
			const sigBytes = base58btc.decode(sig);
			if (!secretKey) {
				set.status = 500;
				return { error: "Server misconfigured" };
			}
			const pubKey = ed.getPublicKey(secretKey);
			const valid = ed.verify(sigBytes, message, pubKey);
			if (!valid) {
				set.status = 401;
				return { error: "Invalid token signature" };
			}
		}

		if (hasEntry(tag, articleUrl)) {
			set.status = 302;
			set.headers.Location = referer;
			return null;
		}

		const tagUrl = `https://${SERVER_HOST}/tag/${tag}`;
		const hasLink = await verifyBacklink(articleUrl, tagUrl);
		if (!hasLink) {
			set.status = 403;
			return { error: "Tag link not found in the article" };
		}

		const ogp = await fetchOgp(articleUrl);
		await addEntry(tag, articleUrl, SERVER_HOST, ogp);

		set.status = 302;
		set.headers.Location = referer;
		return null;
	},
	{
		query: z.object({ token: z.string().optional() }),
	},
);

app.listen(3000);
console.log(`Tag server running on http://localhost:3000 (mode: ${MODE})`);
