export const GAMEMOVE_REPLAY_FORMAT = "abstractplay-gamemove-replay";
export const GAMEMOVE_REPLAY_VERSION = 1;

/**
 * @param {unknown} raw
 * @returns {import('./replayTypes').GameMoveReplayBundle | null}
 */
export function parseGameMoveReplayBundle(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const obj = raw;
  if (obj.format !== GAMEMOVE_REPLAY_FORMAT) {
    return null;
  }
  if (obj.version !== GAMEMOVE_REPLAY_VERSION) {
    return null;
  }
  if (!obj.route?.gameID || !obj.route?.metaGame || obj.route.cbits == null) {
    return null;
  }
  if (!obj.game || typeof obj.game !== "object") {
    return null;
  }
  if (!obj.viewAs?.playerId) {
    return null;
  }
  return obj;
}

export function assertGameMoveReplayBundle(raw) {
  const bundle = parseGameMoveReplayBundle(raw);
  if (!bundle) {
    throw new Error("Invalid abstractplay-gamemove-replay bundle.");
  }
  return bundle;
}
