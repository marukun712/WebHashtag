import { getAllTagEntries, removeEntry } from "./db";
import { verifyBacklink } from "./verify";

const INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export function startRevalidation(serverHost: string): void {
	setInterval(async () => {
		for (const { tag, url } of getAllTagEntries()) {
			const tagUrl = `https://${serverHost}/declare/${tag}`;
			const hasLink = await verifyBacklink(url, tagUrl);
			if (!hasLink) {
				await removeEntry(tag, url, serverHost);
				console.log(`Removed: ${url} from #${tag}`);
			}
		}
	}, INTERVAL_MS);
}
