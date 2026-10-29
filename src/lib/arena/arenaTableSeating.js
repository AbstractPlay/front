/** True when `userId` may call `join_arena_table` for this lobby payload. */
export function canTakeSeatOnArenaTable(table, userId) {
  if (!table || !userId) {
    return false;
  }
  if (table.viewer?.seated) {
    return false;
  }
  if (table.state !== "open" && table.state !== "seated") {
    return false;
  }
  const seatedCount = table.seats?.filter((s) => s.userId).length ?? 0;
  if (seatedCount >= 2) {
    return false;
  }
  if (table.open === false) {
    return table.inviteUserId === userId;
  }
  return true;
}

export function isClosedArenaTable(table) {
  return table?.open === false;
}

/** Public list row (no viewer.seated). */
export function canTakeSeatOnArenaTableRow(row, userId) {
  if (!row || row.open !== false) {
    return Boolean(userId);
  }
  if (!userId) {
    return false;
  }
  return row.inviteUserId === userId;
}
