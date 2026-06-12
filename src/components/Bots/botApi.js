import { callAuthApi } from "../../lib/api";
import { useStore } from "../../stores";

async function parseAuthResponse(res) {
  if (!res) {
    return { ok: false, error: "Not authenticated" };
  }
  if (res.status === 200) {
    try {
      const text = await res.text();
      if (!text) return { ok: true, data: null };
      const parsed = JSON.parse(text);
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        Object.prototype.hasOwnProperty.call(parsed, "statusCode")
      ) {
        if (parsed.statusCode !== 200) {
          let message = `Request failed (${parsed.statusCode})`;
          try {
            const body = JSON.parse(parsed.body);
            if (body?.error) message = body.error;
            else if (typeof body === "string") message = body;
          } catch {
            if (parsed.body) message = parsed.body;
          }
          return { ok: false, error: message };
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
  let error = `Request failed (${res.status})`;
  try {
    const parsed = await res.json();
    if (parsed?.body) {
      try {
        const body = JSON.parse(parsed.body);
        if (body?.error) error = body.error;
      } catch {
        error = parsed.body;
      }
    }
  } catch {
    // keep default error
  }
  return { ok: false, error };
}

export async function createBot({ name, endpoint }) {
  const res = await callAuthApi("create_bot", { name, endpoint });
  return parseAuthResponse(res);
}

export async function updateBot({ clientId, name, endpoint, description }) {
  const res = await callAuthApi("update_bot", {
    clientId,
    name,
    endpoint,
    description,
  });
  return parseAuthResponse(res);
}

export async function deleteBot({ clientId }) {
  const res = await callAuthApi("delete_bot", { clientId });
  return parseAuthResponse(res);
}

export async function beginBotSecretRotation({ clientId }) {
  const res = await callAuthApi("begin_bot_secret_rotation", { clientId });
  return parseAuthResponse(res);
}

export async function finalizeBotSecretRotation({ clientId }) {
  const res = await callAuthApi("finalize_bot_secret_rotation", { clientId });
  return parseAuthResponse(res);
}

export async function testBotStatus() {
  const res = await callAuthApi("test_bot_status", {});
  return parseAuthResponse(res);
}

export async function refreshMe() {
  const res = await callAuthApi("me", { size: "small" });
  const result = await parseAuthResponse(res);
  if (!result.ok) return result;
  const backendData = result.data ?? {};
  const { setGlobalMe } = useStore.getState();
  setGlobalMe((prev) => ({
    ...prev,
    ...backendData,
    challengesIssued: prev?.challengesIssued ?? [],
    challengesReceived: prev?.challengesReceived ?? [],
    challengesAccepted: prev?.challengesAccepted ?? [],
    standingChallenges: prev?.standingChallenges ?? [],
    bots: backendData.bots ?? prev?.bots ?? [],
  }));
  return result;
}
