/**
 * Who may post in arena table lobby chat (mirrors backend kibitz pre-launch).
 */
export function canCommentArenaTableChat(me, table) {
  if (!me?.id || !table) {
    return false;
  }
  if (me.admin === true) {
    return true;
  }
  if (table.viewer?.seated === true) {
    return true;
  }
  const state = table.state;
  if (state === "open" || state === "seated") {
    return true;
  }
  if (state === "ended") {
    return true;
  }
  return false;
}

export function arenaTableChatPlayers(table, allUsers) {
  const seats = table?.seats ?? [];
  return seats
    .filter((s) => s.userId)
    .map((s) => {
      const u = allUsers?.[s.userId];
      return { id: s.userId, name: u?.name ?? s.userId };
    });
}
