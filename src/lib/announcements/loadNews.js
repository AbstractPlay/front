import { announcementToNewsItem, fetchAnnouncementsList } from "./announcementApi";
import { computeBellPublishedAfter } from "./announcementFeedConfig";

const BELL_PAGE_SIZE = 50;

/**
 * Lightweight feed for bell unread + cursor bootstrap (no attachment presign).
 * @param {object | null | undefined} globalMe
 * @returns {Promise<object[]>} sorted newest first
 */
export async function loadAnnouncementsBellBootstrap(globalMe) {
  const publishedAfter = computeBellPublishedAfter(globalMe);
  const items = [];
  let cursor;
  for (;;) {
    const page = await fetchAnnouncementsList({
      limit: BELL_PAGE_SIZE,
      cursor,
      publishedAfter,
    });
    if (!page.ok) {
      console.warn("[news] announcements_list failed:", page.error);
      break;
    }
    items.push(...(page.data.items ?? []));
    cursor = page.data.nextCursor;
    if (!cursor) {
      break;
    }
  }
  return items
    .map(announcementToNewsItem)
    .sort((a, b) => b.publishedAt - a.publishedAt);
}
