/**
 * Match records cron `applyArenaSiteFieldsToRecord` (node-backend crons archiveGameRecord.ts).
 */

export function applyArenaSiteFieldsToGameRecord(rec, game) {
  if (!rec?.header?.site || game?.playMode !== "arena") {
    return rec;
  }
  rec.header.site.playMode = "arena";
  if (typeof game.arenaTcId === "string" && game.arenaTcId.length > 0) {
    rec.header.site.arenaTcId = game.arenaTcId;
  }
  if (game.arenaClock !== undefined && game.arenaClock !== null) {
    const { startSec, incSec, maxSec } = game.arenaClock;
    rec.header.site.arenaClock = { startSec, incSec, maxSec };
  }
  return rec;
}
