/**
 * Opponent user id for submit_move premove lookup (server reads GAMEEXPLORATION#…/{opponentId}#{moveNumber}).
 */
export function submitMoveOpponentId(players, meId) {
  if (!players?.length || meId == null) {
    return undefined;
  }
  const opponent = players.find((p) => p.id !== meId);
  return opponent?.id;
}
