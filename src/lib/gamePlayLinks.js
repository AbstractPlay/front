import { isArenaGame } from "./arena/arenaGame.js";
import { arenaPlayPath, arenaWatchPath } from "./arena/arenaRoutes.js";
import { MOVE_BASE } from "./GameMove/layoutPreference.js";

/**
 * Canonical in-app URL for live play or replay of a game row.
 *
 * @param {{ metaGame?: string, meta?: string, metagame?: string, id: string, playMode?: string }} game
 * @param {{ cbit?: number|string, layout?: string, spectate?: boolean }} [opts]
 */
export function canonicalGamePlayPath(game, { cbit = 1, layout, spectate = false } = {}) {
  const metaGame = game.metaGame ?? game.meta ?? game.metagame;
  const id = game.id;
  if (!metaGame || !id) {
    return MOVE_BASE;
  }
  if (isArenaGame(game)) {
    return spectate
      ? arenaWatchPath(metaGame, id, { layout })
      : arenaPlayPath(metaGame, id, { layout });
  }
  const bit = cbit ?? 1;
  return `${MOVE_BASE}/${metaGame}/${bit}/${id}`;
}

/** Link target from an archived record `header.site` (player profile history). */
export function canonicalGamePlayPathFromRecordSite(
  site,
  metaGame,
  gameId,
  opts = {},
) {
  return canonicalGamePlayPath(
    { metaGame, id: gameId, playMode: site?.playMode },
    { cbit: 1, ...opts },
  );
}

/** Active game: completed when no turn or gameEnded set. */
export function canonicalGamePlayPathForActiveRow(game) {
  const finished =
    game.gameEnded !== undefined && game.gameEnded !== null
    || game.toMove === ""
    || game.toMove === null;
  const cbit = finished ? 1 : 0;
  return canonicalGamePlayPath(game, { cbit });
}
