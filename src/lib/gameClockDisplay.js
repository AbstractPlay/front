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
