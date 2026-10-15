import { callAuthApi } from "../../lib/api";
import { fetchProfile } from "../../lib/globalMeBootstrap";
import { parseAuthResponse } from "../../lib/parseAuthResponse";

export async function createBot({ name, endpoint }) {
  const res = await callAuthApi("create_bot", { name, endpoint });
  return parseAuthResponse(res);
}

export async function updateBot({
  clientId,
  name,
  endpoint,
  description,
  supported,
}) {
  const res = await callAuthApi("update_bot", {
    clientId,
    name,
    endpoint,
    description,
    supported,
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
  const profile = await fetchProfile();
  if (profile === null) {
    return { ok: false, error: "Not authenticated" };
  }
  return { ok: true, data: profile };
}
