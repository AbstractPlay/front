/** @param {{ matchLegs?: number } | null | undefined} tournament */
export function isTwoLegTournament(tournament) {
  return tournament?.matchLegs === 2;
}
