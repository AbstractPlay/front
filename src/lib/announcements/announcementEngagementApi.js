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
          return { ok: false, error: message, code: body?.code };
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

export async function markAnnouncementsRead(readAt) {
  const pars = readAt !== undefined ? { readAt } : {};
  const res = await callAuthApi("announcements_mark_read", pars);
  return parseAuthResponse(res);
}

export async function reactToAnnouncement(id, emoji) {
  const res = await callAuthApi("announcement_react", { id, emoji });
  return parseAuthResponse(res);
}

export async function fetchAnnouncementReactionsMine(ids) {
  const res = await callAuthApi("announcement_reactions_mine", { ids });
  return parseAuthResponse(res);
}
