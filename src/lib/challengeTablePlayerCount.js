/**
 * Players-column label for challenge tables (open-seat suffix only for 3+ player games).
 */
export function formatChallengeTablePlayerCount(numPlayers, openSlots, t) {
  const total = numPlayers ?? 2;
  const open = openSlots ?? 0;
  if (open > 0 && total > 2) {
    return t("StandingChallengeOpenSeats", { total, open });
  }
  return String(total);
}
