import {
  announcementToNewsItem,
  enrichAnnouncementAttachmentUrls,
  fetchAllAnnouncements,
} from "./announcementApi";

/**
 * @returns {Promise<object[]>} sorted newest first
 */
export async function loadAnnouncementsForStore() {
  const api = await fetchAllAnnouncements();
  if (!api.ok) {
    console.warn("[news] announcements_list failed:", api.error);
    return [];
  }
  const enriched = await enrichAnnouncementAttachmentUrls(api.items);
  return enriched
    .map(announcementToNewsItem)
    .sort((a, b) => b.publishedAt - a.publishedAt);
}
