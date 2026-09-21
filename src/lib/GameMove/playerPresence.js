/**
 * Whether to show the "player is online" wifi icon for a seat.
 * Matches legacy MoveEntry behaviour: signed-in viewers only.
 */
export function shouldShowPlayerOnline(globalMe, connections, playerId) {
  if (globalMe === null || !playerId) {
    return false;
  }
  return Boolean(connections?.visibleUserIds?.includes(playerId));
}
