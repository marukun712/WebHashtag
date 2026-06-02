import { z } from "zod";
import { buildAtomFeed } from "./atom";

type OgpData = {
	title: string | null;
	description: string | null;
	image: string | null;
};

export type Entry = {
	url: string;
	registeredAt: string;
	ogp: OgpData;
};

type TagStore = Map<string, Map<string, Entry>>;

const store: TagStore = new Map();

const persistedTagSchema = z.object({
	tag: z.string(),
	entries: z.array(
		z.object({
			url: z.string(),
			registeredAt: z.string(),
			ogp: z.object({
				title: z.string().nullable(),
				description: z.string().nullable(),
				image: z.string().nullable(),
			}),
		}),
	),
});

export async function loadFromFiles(): Promise<void> {
	const glob = new Bun.Glob("public/tag/*.json");
	for await (const file of glob.scan(".")) {
		const text = await Bun.file(file).text();
		const result = persistedTagSchema.safeParse(JSON.parse(text));
		if (!result.success) continue;
		const { tag, entries } = result.data;
		const tagMap = new Map<string, Entry>();
		for (const entry of entries) {
			tagMap.set(entry.url, entry);
		}
		store.set(tag, tagMap);
	}
}

export function getEntries(tag: string): Entry[] {
	const tagMap = store.get(tag);
	if (!tagMap) return [];
	return Array.from(tagMap.values());
}

export function hasEntry(tag: string, url: string): boolean {
	return store.get(tag)?.has(url) ?? false;
}

export async function addEntry(
	tag: string,
	url: string,
	serverHost: string,
	ogp: OgpData,
): Promise<void> {
	if (!store.has(tag)) {
		store.set(tag, new Map());
	}
	const tagMap = store.get(tag);
	if (tagMap) {
		tagMap.set(url, { url, registeredAt: new Date().toISOString(), ogp });
	}
	await persistFiles(tag, serverHost);
}

export async function removeEntry(
	tag: string,
	url: string,
	serverHost: string,
): Promise<void> {
	store.get(tag)?.delete(url);
	await persistFiles(tag, serverHost);
}

export function getAllTagEntries(): Array<{ tag: string; url: string }> {
	const result: Array<{ tag: string; url: string }> = [];
	for (const [tag, tagMap] of store) {
		for (const url of tagMap.keys()) {
			result.push({ tag, url });
		}
	}
	return result;
}

async function persistFiles(tag: string, serverHost: string): Promise<void> {
	const entries = getEntries(tag);

	const json = JSON.stringify({ tag, server: serverHost, entries }, null, 2);
	await Bun.write(`public/tag/${tag}.json`, json);

	const atom = buildAtomFeed(tag, serverHost, entries);
	await Bun.write(`public/feed/${tag}.atom`, atom);
}
