/**
 * Map client wall clock to server time using a one-shot offset from arena_sync / get_game.
 */
export function arenaServerClockOffsetMs(serverTimeMs) {
  if (serverTimeMs === undefined || serverTimeMs === null) {
    return undefined;
  }
  return serverTimeMs - Date.now();
}

/** Wall time aligned to backend `Date.now()` when offset is known. */
export function arenaSyncedNow(game, clientNow = Date.now()) {
  const offset = game?.arenaServerClockOffsetMs;
  if (offset === undefined || offset === null) {
    return clientNow;
  }
  return clientNow + offset;
}

/** Stamp offset from get_game `clockDisplayServerTime` (arena rows only). */
export function seedArenaServerClockOffset(game) {
  if (!game || game.playMode !== "arena") {
    return game;
  }
  const serverTime = game.clockDisplayServerTime;
  if (serverTime === undefined || serverTime === null) {
    return game;
  }
  return {
    ...game,
    arenaServerClockOffsetMs: arenaServerClockOffsetMs(serverTime),
  };
}

/**
 * Apply arena_sync / arena_play_ready clock fields on the client GAME row.
 * Must mirror server beginArenaCountdown (lastMoveTime = arenaClockStartAt).
 */
export function mergeArenaClockSync(game, { arenaClockStartAt, serverTime } = {}) {
  if (!game || arenaClockStartAt === undefined || arenaClockStartAt === null) {
    return game;
  }
  const clockDisplayServerTime = serverTime ?? game.clockDisplayServerTime ?? Date.now();
  const offset =
    serverTime !== undefined && serverTime !== null
      ? arenaServerClockOffsetMs(serverTime)
      : game.arenaServerClockOffsetMs;
  const players = Array.isArray(game.players)
    ? game.players.map((p) => ({
        ...p,
        effectiveRemainingMs: p.effectiveRemainingMs ?? p.time ?? 0,
      }))
    : game.players;
  return {
    ...game,
    arenaClockStartAt,
    lastMoveTime: arenaClockStartAt,
    clockDisplayServerTime,
    ...(offset !== undefined ? { arenaServerClockOffsetMs: offset } : {}),
    players,
  };
}

/** Prefer persisted GAME row, then client ref set from WS / play_ready. */
export function resolveArenaClockStartAt(game, refStartAt) {
  if (game?.arenaClockStartAt !== undefined && game?.arenaClockStartAt !== null) {
    return game.arenaClockStartAt;
  }
  if (refStartAt !== undefined && refStartAt !== null) {
    return refStartAt;
  }
  return undefined;
}
