import { callAuthApi } from "../api";

async function parseAuthResponse(res) {
  if (!res) {
    return { ok: false, error: "Not authenticated" };
  }
  if (res.status === 200) {
    try {
      const text = await res.text();
      if (!text) {
        return { ok: true, data: null };
      }
      const parsed = JSON.parse(text);
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        Object.prototype.hasOwnProperty.call(parsed, "statusCode")
      ) {
        if (parsed.statusCode !== 200) {
          let message = `Request failed (${parsed.statusCode})`;
          let body = null;
          try {
            body = JSON.parse(parsed.body);
            if (body?.message) {
              message = body.message;
            }
          } catch {
            if (parsed.body) {
              message = parsed.body;
            }
          }
          return {
            ok: false,
            error: message,
            code: body?.code,
          };
        }
        const data =
          parsed.body === undefined || parsed.body === null
            ? null
            : JSON.parse(parsed.body);
        return { ok: true, data };
      }
      return { ok: true, data: parsed };
    } catch (err) {
      return { ok: false, error: err.message || "Failed to parse response" };
    }
  }
  return { ok: false, error: `Request failed (${res.status})` };
}

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
