import { callAuthApi } from "../api";
import { API_ENDPOINT_OPEN } from "../../config";

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
            existingId: body?.existingId,
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

async function fetchOpen(query, pars) {
  const res = await fetch(API_ENDPOINT_OPEN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function listFeedback({ kind, sort = "recent", limit = 50, cursor }) {
  return fetchOpen("feedback_list", { kind, sort, limit, cursor });
}

/** Fetch every page until the API stops returning nextCursor. */
export async function listFeedbackAll({ kind, sort = "recent", limit = 100 }) {
  const items = [];
  let cursor;
  do {
    const result = await listFeedback({ kind, sort, limit, cursor });
    if (!result.ok) {
      return result;
    }
    items.push(...(result.data?.items ?? []));
    cursor = result.data?.nextCursor;
  } while (cursor);
  return { ok: true, data: { items } };
}

export async function getFeedbackOpen(id) {
  return fetchOpen("feedback_get", { id });
}

export async function getFeedbackAuth(id) {
  const res = await callAuthApi("feedback_get", { id });
  return parseAuthResponse(res);
}

export async function createFeedback(pars) {
  const res = await callAuthApi("feedback_create", pars);
  return parseAuthResponse(res);
}

export async function presignFeedbackUpload(pars) {
  const res = await callAuthApi("feedback_presign_upload", pars);
  return parseAuthResponse(res);
}

export async function voteFeedback(id, vote) {
  const res = await callAuthApi("feedback_vote", { id, vote });
  return parseAuthResponse(res);
}

export async function commentFeedback(id, body, subscribe = true) {
  const res = await callAuthApi("feedback_comment", { id, body, subscribe });
  return parseAuthResponse(res);
}

export async function subscribeFeedback(id, subscribe) {
  const res = await callAuthApi("feedback_subscribe", { id, subscribe });
  return parseAuthResponse(res);
}

export async function setFeedbackStatus(id, status) {
  const res = await callAuthApi("feedback_set_status", { id, status });
  return parseAuthResponse(res);
}

export async function updateFeedback(pars) {
  const res = await callAuthApi("feedback_update", pars);
  return parseAuthResponse(res);
}

export async function setFeedbackAdminFields(pars) {
  const res = await callAuthApi("feedback_set_admin_fields", pars);
  return parseAuthResponse(res);
}

export async function listMyFeedback(pars = {}) {
  const res = await callAuthApi("feedback_mine", pars);
  return parseAuthResponse(res);
}

export async function listFeedbackAdmin(pars) {
  const res = await callAuthApi("feedback_admin_list", pars);
  return parseAuthResponse(res);
}

export async function searchWishlist({ q, limit = 20 }) {
  return fetchOpen("wishlist_search", { q, limit });
}

export async function deleteFeedback(id, reason) {
  const res = await callAuthApi("feedback_delete", { id, reason });
  return parseAuthResponse(res);
}

export async function listFeedbackHistory({ kind, limit = 50, cursor }) {
  return fetchOpen("feedback_history_list", { kind, limit, cursor });
}

export async function holdFeedbackRetention(id, hold) {
  const res = await callAuthApi("feedback_hold_retention", { id, hold });
  return parseAuthResponse(res);
}
