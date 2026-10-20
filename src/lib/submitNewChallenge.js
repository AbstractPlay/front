import { callAuthApi } from "./api";
import { parseAuthResponse } from "./parseAuthResponse";
import { rawDirectoryDisplayName } from "../components/Bots/botUtils";

/**
 * Issue a challenge via auth `new_challenge`.
 * @returns {Promise<{ ok: true, data: unknown } | { ok: false, error: string }>}
 */
export async function submitNewChallenge(challenge, me, users) {
  if (!me?.id) {
    return { ok: false, error: "Not authenticated" };
  }
  const res = await callAuthApi("new_challenge", {
    ...challenge,
    challenger: {
      id: me.id,
      name: rawDirectoryDisplayName(me, users),
    },
  });
  return parseAuthResponse(res);
}
