/**
 * Whether the signed-in user may post tournament chat.
 * @param {{ id?: string; admin?: boolean } | null | undefined} me
 * @param {Array<{ playerid?: string }>} playerRows
 */
export function canCommentTournamentChat(me, playerRows) {
  if (me?.id === undefined || me.id === "") {
    return false;
  }
  if (me.admin === true) {
    return true;
  }
  const rows = playerRows ?? [];
  return rows.some((p) => p.playerid === me.id);
}

/** Map tournament player rows to UserChats `players` shape. */
export function tournamentChatPlayers(playerRows) {
  return (playerRows ?? [])
    .filter((p) => p.playerid)
    .map((p) => ({ id: p.playerid, name: p.playername ?? "" }));
}
