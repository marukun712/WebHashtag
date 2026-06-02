// https://github.com/ukyoda/ogp-parser
import ogpParser from "ogp-parser";

export type OgpData = {
	title: string | null;
	description: string | null;
	image: string | null;
};

export async function verifyBacklink(
	articleUrl: string,
	tagUrl: string,
): Promise<boolean> {
	let html: string;
	try {
		const res = await fetch(articleUrl, {
			headers: { "User-Agent": "WebHashtag-Bot/0.1" },
		});
		if (!res.ok) return false;
		html = await res.text();
	} catch {
		return false;
	}
	return html.includes(tagUrl);
}

export async function fetchOgp(articleUrl: string): Promise<OgpData> {
	try {
		const data = await ogpParser(articleUrl, { skipOembed: true });
		return {
			title: data.ogp["og:title"]?.[0] ?? data.title ?? null,
			description: data.ogp["og:description"]?.[0] ?? null,
			image: data.ogp["og:image"]?.[0] ?? null,
		};
	} catch {
		return { title: null, description: null, image: null };
	}
}
