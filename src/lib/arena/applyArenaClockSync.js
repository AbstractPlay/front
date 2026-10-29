/**
 * Arena client clocks: one model only.
 *
 * Server authority is persisted Fischer state (`players[].time`, `lastMoveTime`,
 * `arenaClockStartAt`). The client maps wall clock → server time via
 * `arenaServerClockOffsetMs` (from `clockDisplayServerTime` or arena_sync
 * `serverTime`), then ticks active seats as:
 *   remaining = player.time - (serverNow - lastMoveTime)
 *
 * We do not use correspondence-style `effectiveRemainingMs` snapshots on arena
 * play pages — those diverge when one client refreshed via get_game and another
 * applied submit_arena_move.
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

function stripArenaPlayerDisplaySeeds(player) {
  if (!player || typeof player !== "object") {
    return player;
  }
  const { effectiveRemainingMs, clockPaused, ...rest } = player;
  return rest;
}

/**
 * Prepare a GAME row for arena UI: refresh server offset when the API sent
 * `clockDisplayServerTime`, preserve offset across bare move payloads, drop
 * display-only player seeds.
 */
export function normalizeArenaClientGame(game, prevGame) {
  if (!game || game.playMode !== "arena") {
    return game;
  }
  let next = game;
  if (game.clockDisplayServerTime !== undefined && game.clockDisplayServerTime !== null) {
    next = {
      ...next,
      arenaServerClockOffsetMs: arenaServerClockOffsetMs(game.clockDisplayServerTime),
    };
  } else if (
    prevGame?.id === game.id &&
    prevGame?.arenaServerClockOffsetMs != null &&
    (next.arenaServerClockOffsetMs === undefined || next.arenaServerClockOffsetMs === null)
  ) {
    next = {
      ...next,
      arenaServerClockOffsetMs: prevGame.arenaServerClockOffsetMs,
    };
  }
  if (Array.isArray(next.players)) {
    next = {
      ...next,
      players: next.players.map(stripArenaPlayerDisplaySeeds),
    };
  }
  return next;
}

/** @deprecated Prefer normalizeArenaClientGame */
export function seedArenaServerClockOffset(game) {
  return normalizeArenaClientGame(game);
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
  return normalizeArenaClientGame(
    {
      ...game,
      arenaClockStartAt,
      lastMoveTime: arenaClockStartAt,
      clockDisplayServerTime,
      ...(offset !== undefined ? { arenaServerClockOffsetMs: offset } : {}),
    },
    game,
  );
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
