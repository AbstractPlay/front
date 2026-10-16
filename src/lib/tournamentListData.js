import { getGameDisplayName } from "./gameOptions";
import { formatVariantsJoined } from "./expandVariants";

/** Sum completion counts across tournament divisions (matches Tournaments current tab). */
export function tournamentDivisionsCompletion(divisions) {
  if (!divisions || typeof divisions !== "object") {
    return { numCompleted: 0, numGames: 0 };
  }
  return Object.values(divisions).reduce(
    (acc, d) => ({
      numCompleted: acc.numCompleted + (d?.numCompleted ?? 0),
      numGames: acc.numGames + (d?.numGames ?? 0),
    }),
    { numCompleted: 0, numGames: 0 }
  );
}

/**
 * Map `me_dashboard.currentTournaments` items to table rows for the dashboard.
 * @param {Array<{
 *   id: string;
 *   metaGame: string;
 *   variants?: string[];
 *   number: number;
 *   matchLegs?: number;
 *   dateStarted?: number;
 *   divisions?: Record<string, { numCompleted?: number; numGames?: number }>;
 *   players?: string[];
 * }>} tournaments
 */
export function dashboardTournamentsToCurrentRows(tournaments) {
  if (!Array.isArray(tournaments)) {
    return [];
  }
  return tournaments.map((t) => ({
    tournamentid: t.id,
    realMeta: t.metaGame,
    metaGame: getGameDisplayName(t.metaGame, "Unknown"),
    variantUids: [...(t.variants ?? [])],
    variants: formatVariantsJoined(t.metaGame, t.variants),
    number: t.number,
    matchLegs: t.matchLegs,
    dateStarted: t.dateStarted,
    players: t.players ?? [],
    completion: tournamentDivisionsCompletion(t.divisions),
  }));
}
