/** @typedef {'idle' | 'connecting' | 'open' | 'reconnecting' | 'offline'} WsConnectionStatus */

export const WS_CONNECTION_INITIAL = {
  status: "idle",
  lastError: undefined,
  updatedAt: 0,
};

/**
 * Live arena actions require an open socket and a send function bound to it.
 * @param {{ status?: WsConnectionStatus }} wsConnection
 * @param {((action: string, body?: object) => void) | null} wsSend
 */
export function isRealtimeConnectionReady(wsConnection, wsSend) {
  return wsConnection?.status === "open" && typeof wsSend === "function";
}

/**
 * @param {{ status?: WsConnectionStatus }} wsConnection
 * @param {((action: string, body?: object) => void) | null} wsSend
 */
export function shouldBlockArenaRealtimeActions(wsConnection, wsSend) {
  return !isRealtimeConnectionReady(wsConnection, wsSend);
}

/**
 * UI copy bucket for problem-only banners (never shown when `open`).
 * @param {{ status?: WsConnectionStatus }} wsConnection
 * @returns {'connecting' | 'reconnecting' | 'offline' | null}
 */
export function wsConnectionNoticeVariant(wsConnection) {
  const status = wsConnection?.status ?? "idle";
  if (status === "open") {
    return null;
  }
  if (status === "connecting") {
    return "connecting";
  }
  if (status === "offline") {
    return "offline";
  }
  return "reconnecting";
}