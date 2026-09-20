import { callAuthApi } from "../api";
import { parseAuthResponse } from "../parseAuthResponse";

async function listAllPages(fetchPage) {
  const items = [];
  let cursor;
  do {
    const result = await fetchPage(cursor);
    if (!result.ok) {
      return result;
    }
    items.push(...(result.data?.items ?? []));
    cursor = result.data?.nextCursor;
  } while (cursor);
  return { ok: true, data: { items } };
}

export async function listAnnouncementsAdmin(pars = {}) {
  const res = await callAuthApi("announcements_admin_list", pars);
  return parseAuthResponse(res);
}

export async function listAnnouncementsAdminAll(pars = {}) {
  const { limit = 100, ...rest } = pars;
  return listAllPages((cursor) => listAnnouncementsAdmin({ ...rest, limit, cursor }));
}

export async function getAnnouncementAuth(id) {
  const res = await callAuthApi("announcement_get", { id });
  return parseAuthResponse(res);
}

export async function saveAnnouncement(pars) {
  const res = await callAuthApi("announcement_save", pars);
  return parseAuthResponse(res);
}

export async function presignAnnouncementUpload(pars) {
  const res = await callAuthApi("announcement_presign_upload", pars);
  return parseAuthResponse(res);
}

export async function publishAnnouncement(id) {
  const res = await callAuthApi("announcement_publish", { id });
  return parseAuthResponse(res);
}

export async function retractAnnouncement(id) {
  const res = await callAuthApi("announcement_retract", { id });
  return parseAuthResponse(res);
}

export function attachmentUrlMapFromGet(data) {
  const map = {};
  for (const entry of data?.attachmentUrls ?? []) {
    if (entry?.key && entry?.url) {
      map[entry.key] = entry.url;
    }
  }
  return map;
}
