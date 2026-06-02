// https://github.com/jpmonette/feed
import { Feed } from "feed";

type Entry = {
	url: string;
	registeredAt: string;
	ogp: {
		title: string | null;
		description: string | null;
		image: string | null;
	};
};

export function buildAtomFeed(
	tag: string,
	serverHost: string,
	entries: Entry[],
): string {
	const feedUrl = `https://${serverHost}/feed/${tag}.atom`;

	const feed = new Feed({
		title: `#${tag} - ${serverHost}`,
		id: feedUrl,
		link: feedUrl,
		copyright: "",
	});

	for (const entry of entries) {
		feed.addItem({
			title: entry.ogp.title ?? entry.url,
			id: entry.url,
			link: entry.url,
			description: entry.ogp.description ?? undefined,
			image: entry.ogp.image ?? undefined,
			date: new Date(entry.registeredAt),
		});
	}

	return feed.atom1();
}
