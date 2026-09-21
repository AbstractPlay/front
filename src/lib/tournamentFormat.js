import { canonicalVariantKey } from "./expandVariants";

/** @param {{ matchLegs?: number } | null | undefined} tournament */
export function isTwoLegTournament(tournament) {
  return tournament?.matchLegs === 2;
}

/** Stable series key (matches backend `tournamentSeriesCounterSk`). */
export function tournamentSeriesKey(metaGame, variants, matchLegs) {
  const base = `${metaGame}#${canonicalVariantKey(metaGame, variants)}`;
  return isTwoLegTournament({ matchLegs }) ? `${base}#2` : base;
}
