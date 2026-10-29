/**
 * Apply arena_sync / arena_play_ready clock fields on the client GAME row.
 * Must mirror server beginArenaCountdown (lastMoveTime = arenaClockStartAt).
 */
export function mergeArenaClockSync(game, { arenaClockStartAt, serverTime } = {}) {
  if (!game || arenaClockStartAt === undefined || arenaClockStartAt === null) {
    return game;
  }
  const clockDisplayServerTime = serverTime ?? Date.now();
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
