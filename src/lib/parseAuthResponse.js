const HTTP_ERROR_BODY_SNIPPET = 200;

function snippetForSupport(text) {
  if (!text || typeof text !== "string") {
    return "";
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.length <= HTTP_ERROR_BODY_SNIPPET) {
    return trimmed;
  }
  return `${trimmed.slice(0, HTTP_ERROR_BODY_SNIPPET)}…`;
}

function parseEnvelopeBody(body) {
  if (body === undefined || body === null) {
    return null;
  }
  if (typeof body === "string") {
    return JSON.parse(body);
  }
  return body;
}

function errorMessageFromEnvelope(parsed) {
  let message = `Request failed (${parsed.statusCode})`;
  let body = null;
  try {
    body = parseEnvelopeBody(parsed.body);
    if (body?.message) {
      message = body.message;
    }
  } catch {
    if (parsed.body) {
      message = String(parsed.body);
    }
  }
  return { message, body };
}

/**
 * Parse a fetch Response from POST authQuery (Lambda proxy envelope).
 * @returns {{ ok: true, data: unknown } | { ok: false, error: string, code?: string, existingId?: string }}
 */
export async function parseAuthResponse(res) {
  if (!res) {
    return { ok: false, error: "Not authenticated" };
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

  if (res.status !== 200) {
    const snippet = snippetForSupport(text);
    const base = `Request failed (HTTP ${res.status})`;
    return {
      ok: false,
      error: snippet ? `${base}: ${snippet}` : base,
    };
  }

  if (!text) {
    return { ok: true, data: null };
  }

  try {
    const parsed = JSON.parse(text);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      Object.prototype.hasOwnProperty.call(parsed, "statusCode")
    ) {
      if (parsed.statusCode !== 200) {
        const { message, body } = errorMessageFromEnvelope(parsed);
        return {
          ok: false,
          error: message,
          code: body?.code,
          existingId: body?.existingId,
        };
      }
      try {
        const data = parseEnvelopeBody(parsed.body);
        return { ok: true, data };
      } catch (err) {
        return {
          ok: false,
          error: err.message || "Failed to parse response body",
        };
      }
    }
    return { ok: true, data: parsed };
  } catch (err) {
    return { ok: false, error: err.message || "Failed to parse response" };
  }
}
