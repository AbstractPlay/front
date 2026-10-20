/**
 * Parse GET /query responses (direct JSON array or Lambda proxy envelope).
 * @returns {{ ok: true, data: unknown[] } | { ok: false, error: string }}
 */
export async function parsePublicQueryList(res) {
  if (!res) {
    return { ok: false, error: "No response" };
  }
  let text = "";
  try {
    text = await res.text();
  } catch (err) {
    return {
      ok: false,
      error: err.message || "Failed to read response",
    };
  }
  if (!res.ok) {
    const snippet = text.trim().slice(0, 200);
    return {
      ok: false,
      error: snippet
        ? `Request failed (HTTP ${res.status}): ${snippet}`
        : `Request failed (HTTP ${res.status})`,
    };
  }
  if (!text.trim()) {
    return { ok: true, data: [] };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Invalid JSON in response" };
  }
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    Object.prototype.hasOwnProperty.call(parsed, "statusCode")
  ) {
    if (parsed.statusCode !== 200) {
      let message = `Request failed (${parsed.statusCode})`;
      try {
        const body =
          typeof parsed.body === "string"
            ? JSON.parse(parsed.body)
            : parsed.body;
        if (body?.message) {
          message = body.message;
        }
      } catch {
        if (parsed.body) {
          message = String(parsed.body);
        }
      }
      return { ok: false, error: message };
    }
    try {
      const data =
        typeof parsed.body === "string"
          ? JSON.parse(parsed.body)
          : parsed.body;
      if (!Array.isArray(data)) {
        return { ok: false, error: "Expected a list of challenges" };
      }
      return { ok: true, data };
    } catch {
      return { ok: false, error: "Failed to parse response body" };
    }
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, error: "Expected a list of challenges" };
  }
  return { ok: true, data: parsed };
}
