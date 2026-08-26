import { gameinfo } from "@abstractplay/gameslib";

/** Whether automated tournaments can run for this title (requires `playercount: 2`). */
export function tournamentPlaySupported(metaGame) {
  const info = gameinfo.get(metaGame);
  return info !== undefined && info.playercounts.includes(2);
}
