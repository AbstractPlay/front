import { API_ENDPOINT_OPEN } from "../../config";

async function fetchOpen(query, pars) {
  const res = await fetch(API_ENDPOINT_OPEN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ query, pars }),
  });
  if (!res.ok) {
    let error = `Request failed (${res.status})`;
    try {
      const parsed = await res.json();
      if (parsed?.message) {
        error = parsed.message;
      }
    } catch {
      // keep default
    }
    return { ok: false, error };
  }
  const data = await res.json();
  return { ok: true, data };
}

/**
 * @param {{ limit?: number, cursor?: string }} pars
 */
export async function fetchAnnouncementsList(pars = {}) {
  return fetchOpen("announcements_list", pars);
}

/**
 * @param {string} id
 */
export async function fetchAnnouncementGet(id) {
  return fetchOpen("announcement_get", { id });
}

const ENRICH_BATCH = 10;

/**
 * Load all published announcements (paginated).
 * @returns {Promise<{ ok: true, items: object[] } | { ok: false, error: string }>}
 */
export async function fetchAllAnnouncements() {
  const items = [];
  let cursor;
  for (;;) {
    const page = await fetchAnnouncementsList({ limit: 100, cursor });
    if (!page.ok) {
      return page;
    }
    items.push(...(page.data.items ?? []));
    cursor = page.data.nextCursor;
    if (!cursor) {
      break;
    }
  }
  return { ok: true, items };
}

function attachmentUrlMapFromGet(data) {
  const map = {};
  for (const entry of data?.attachmentUrls ?? []) {
    if (entry?.key && entry?.url) {
      map[entry.key] = entry.url;
    }
  }
  return map;
}

/**
 * Presign URLs for items that reference attachments (list API omits URLs).
 * @param {Array<{ id: string, attachmentKeys?: string[], body?: string }>} items
 */
export async function enrichAnnouncementAttachmentUrls(items) {
  const needsEnrich = items.filter(
    (item) => (item.attachmentKeys?.length ?? 0) > 0
      || (item.body && item.body.includes("ap-att:")),
  );
  if (needsEnrich.length === 0) {
    return items.map((item) => ({ ...item, attachmentUrlByKey: {} }));
  }

  const urlById = new Map();
  for (let i = 0; i < needsEnrich.length; i += ENRICH_BATCH) {
    const batch = needsEnrich.slice(i, i + ENRICH_BATCH);
    await Promise.all(batch.map(async (item) => {
      const got = await fetchAnnouncementGet(item.id);
      if (got.ok) {
        urlById.set(item.id, attachmentUrlMapFromGet(got.data));
      }
    }));
  }

  return items.map((item) => ({
    ...item,
    attachmentUrlByKey: urlById.get(item.id) ?? {},
  }));
}

/**
 * Normalize API rows for Zustand `news` (keeps `time` / `text` for unread helpers).
 */
export function announcementToNewsItem(row) {
  return {
    id: row.id,
    title: row.title ?? "Announcement",
    body: row.body ?? "",
    text: row.body ?? "",
    publishedAt: row.publishedAt,
    time: row.publishedAt,
    attachmentUrlByKey: row.attachmentUrlByKey ?? {},
    reactionCounts: row.reactionCounts ?? {},
  };
}
