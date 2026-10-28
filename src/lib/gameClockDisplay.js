/**
 * Client clock display from server-seeded fields on get_game / me_dashboard.
 * Falls back to legacy bank math when seeds are absent (older API responses).
 */

export function tickDisplayRemainingMs(player, game, now = Date.now()) {
  if (
    player?.effectiveRemainingMs !== undefined
    && game?.clockDisplayServerTime !== undefined
  ) {
    if (player.clockPaused) {
      return player.effectiveRemainingMs;
    }
    const elapsed = Math.max(0, now - game.clockDisplayServerTime);
    return player.effectiveRemainingMs - elapsed;
  }
  if (player?.time === undefined || game?.lastMoveTime === undefined) {
    return player?.time ?? 0;
  }
  return player.time;
}

export function tickActivePlayerRemainingMs(player, game, toMove, playerIndex, now = Date.now()) {
  const active = isPlayerIndexOnMove(playerIndex, toMove);
  if (!active) {
    return player?.time ?? 0;
  }
  if (
    game?.playMode === "arena"
    && player?.time !== undefined
    && game?.lastMoveTime !== undefined
  ) {
    return player.time - (now - game.lastMoveTime);
  }
  if (
    player?.effectiveRemainingMs !== undefined
    && game?.clockDisplayServerTime !== undefined
  ) {
    return tickDisplayRemainingMs(player, game, now);
  }
  if (player?.time === undefined || game?.lastMoveTime === undefined) {
    return 0;
  }
  return player.time - (now - game.lastMoveTime);
}

export function isPlayerIndexOnMove(playerIndex, toMove) {
  if (toMove === "" || toMove === undefined || toMove === null) {
    return false;
  }
  if (Array.isArray(toMove)) {
    return Boolean(toMove[playerIndex]);
  }
  const onMove = parseInt(String(toMove), 10);
  return !Number.isNaN(onMove) && playerIndex === onMove;
}

export function isPlayerTimedOut(player, game, toMove, playerIndex, now = Date.now()) {
  if (!isPlayerIndexOnMove(playerIndex, toMove)) {
    return false;
  }
  return tickActivePlayerRemainingMs(player, game, toMove, playerIndex, now) <= 0;
}

export function anyOnClockPlayerTimedOut(game, now = Date.now()) {
  if (!game?.players || game.toMove === "" || game.toMove === undefined) {
    return false;
  }
  return game.players.some((p, i) => isPlayerTimedOut(p, game, game.toMove, i, now));
}

/** Match server arena flag grace before calling timeloss(check). */
export const ARENA_TIMELOSS_HINT_GRACE_MS = 750;

/**
 * Hard-clock games: client may call timeloss(check) when display passes this threshold.
 * Arena uses grace aligned with backend ARENA_CLOCK_GRACE_MS; correspondence at <= 0.
 */
export function anyOnClockPlayerTimedOutForTimelossHint(game, now = Date.now()) {
  if (!game?.players || game.toMove === "" || game.toMove === undefined) {
    return false;
  }
  const graceMs =
    game.playMode === "arena" ? ARENA_TIMELOSS_HINT_GRACE_MS : 0;
  return game.players.some((p, i) => {
    if (!isPlayerIndexOnMove(i, game.toMove)) {
      return false;
    }
    const remaining = tickActivePlayerRemainingMs(
      p,
      game,
      game.toMove,
      i,
      now
    );
    return remaining <= -graceMs;
  });
}

/**
 * Minimum ticking clock among opponents still to move (sequential or simultaneous).
 * @param {number} myPlayerIndex seat index of the viewer; excluded from the scan
 * @returns {number | undefined} undefined when no opponent is on the clock
 */
export function minOpponentOnClockRemainingMs(game, myPlayerIndex, now = Date.now()) {
  if (!game?.players?.length) {
    return undefined;
  }
  if (game.toMove === "" || game.toMove === undefined || game.toMove === null) {
    return undefined;
  }
  let min = undefined;
  for (let i = 0; i < game.players.length; i++) {
    if (i === myPlayerIndex) {
      continue;
    }
    if (!isPlayerIndexOnMove(i, game.toMove)) {
      continue;
    }
    const ms = tickActivePlayerRemainingMs(
      game.players[i],
      game,
      game.toMove,
      i,
      now,
    );
    if (min === undefined || ms < min) {
      min = ms;
    }
  }
  return min;
}
