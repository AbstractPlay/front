import newsData from "../../assets/news.json";
import {
  announcementToNewsItem,
  enrichAnnouncementAttachmentUrls,
  fetchAllAnnouncements,
} from "./announcementApi";

function legacyNewsItems() {
  if (!newsData || !Array.isArray(newsData)) {
    return [];
  }
  return newsData
    .map((row) => ({
      id: String(row.time),
      title: "Announcement",
      body: row.text ?? "",
      text: row.text ?? "",
      publishedAt: row.time,
      time: row.time,
      attachmentUrlByKey: {},
      reactionCounts: {},
    }))
    .sort((a, b) => b.time - a.time);
}

/**
 * @returns {Promise<object[]>} sorted newest first
 */
export async function loadAnnouncementsForStore() {
  const api = await fetchAllAnnouncements();
  if (!api.ok) {
    console.warn("[news] announcements_list failed, using bundled news.json fallback:", api.error);
    return legacyNewsItems();
  }
  const enriched = await enrichAnnouncementAttachmentUrls(api.items);
  return enriched
    .map(announcementToNewsItem)
    .sort((a, b) => b.publishedAt - a.publishedAt);
}
