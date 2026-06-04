import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
import { base58btc } from "multiformats/bases/base58";

// @ts-expect-error
ed.hashes.sha512 = sha512;

const SECRET_KEY = process.env.SECRET_KEY;
const url = process.argv[2];
const tag = process.argv[3];
const server = process.env.SERVER_HOST ?? "localhost:3000";
const expDays = Number(process.argv[4] ?? "7");
if (!process.env.TAGS) {
	console.error("TAGS env var is required");
	process.exit(1);
}
const TAGS: string[] = process.env.TAGS.split(",")
	.map((t) => t.trim())
	.filter((t) => t.length > 0);

if (!SECRET_KEY) {
	console.error("SECRET_KEY env var is required");
	process.exit(1);
}
if (!url || !tag) {
	console.error("Usage: bun scripts/issue-token.ts <url> <tag> [expDays]");
	process.exit(1);
}

if (!TAGS.includes(tag)) {
	console.error(`Invalid tag. Available tags: ${TAGS.join(", ")}`);
	process.exit(1);
}

const exp = new Date(Date.now() + expDays * 24 * 60 * 60 * 1000).toISOString();
const secretKey = Buffer.from(SECRET_KEY, "hex");

const payload = { url, tag, server, exp };
const message = new TextEncoder().encode(JSON.stringify(payload));
const sigBytes = ed.sign(message, secretKey);
const sig = base58btc.encode(sigBytes);

const token = base58btc.encode(
	new TextEncoder().encode(JSON.stringify({ ...payload, sig })),
);

console.log(token);
