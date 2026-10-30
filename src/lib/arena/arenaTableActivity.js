import { arenaListTableHref } from "./arenaRoutes";

/** Table record states where lobby seat / ready changes still matter. */
export const ARENA_TABLE_LOBBY_STATES = new Set([
  "open",
  "seated",
  "launching",
]);

export function arenaTableSeatUserIds(table) {
  return (table?.seats ?? []).map((s) => s.userId || "");
}

export function snapshotArenaTableSeats(table) {
  if (!table?.tableId) {
    return null;
  }
  return {
    tableId: table.tableId,
    metaGame: table.metaGame,
    state: table.state,
    seats: (table.seats ?? []).map((s) => ({
      userId: s.userId || "",
      ready: Boolean(s.ready),
    })),
  };
}

/**
 * @returns {Array<{ type: 'join'|'leave'|'ready', userId: string, seatIndex: number }>}
 */
export function diffArenaTableSeatActivity(prev, next, myUserId) {
  if (!prev || !next || prev.tableId !== next.tableId) {
    return [];
  }
  if (
    !ARENA_TABLE_LOBBY_STATES.has(prev.state) ||
    !ARENA_TABLE_LOBBY_STATES.has(next.state)
  ) {
    return [];
  }
  if (!myUserId) {
    return [];
  }

  const events = [];
  const seatCount = Math.max(prev.seats.length, next.seats.length);

  for (let seatIndex = 0; seatIndex < seatCount; seatIndex += 1) {
    const before = prev.seats[seatIndex] ?? { userId: "", ready: false };
    const after = next.seats[seatIndex] ?? { userId: "", ready: false };
    const prevId = before.userId;
    const nextId = after.userId;

    if (!prevId && nextId && nextId !== myUserId) {
      events.push({ type: "join", userId: nextId, seatIndex });
      continue;
    }

    if (prevId && prevId !== myUserId && prevId !== nextId && !nextId) {
      events.push({ type: "leave", userId: prevId, seatIndex });
      continue;
    }

    if (
      prevId &&
      prevId === nextId &&
      prevId !== myUserId &&
      !before.ready &&
      after.ready
    ) {
      events.push({ type: "ready", userId: prevId, seatIndex });
    }
  }

  return events;
}

/** Target URL when opening the user's seated arena table from a toast or banner. */
export function arenaTableActivityHref(table, userId, { layout } = {}) {
  if (!table?.tableId || !table.metaGame) {
    return "";
  }
  const row = {
    tableId: table.tableId,
    metaGame: table.metaGame,
    state: table.state === "playing" ? "playing" : "waiting",
    seatUserIds: arenaTableSeatUserIds(table),
  };
  return arenaListTableHref(row, userId, { layout });
}

export function isViewingArenaTableRoute(pathname, table) {
  if (!pathname || !table?.tableId || !table.metaGame) {
    return false;
  }
  const encodedMeta = encodeURIComponent(table.metaGame);
  const encodedId = encodeURIComponent(table.tableId);
  const lobbyPrefix = `/arena/table/${encodedMeta}/${encodedId}`;
  const playPrefix = `/arena/play/${encodedMeta}/${encodedId}`;
  const watchPrefix = `/arena/watch/${encodedMeta}/${encodedId}`;
  return (
    pathname === lobbyPrefix ||
    pathname.startsWith(`${playPrefix}`) ||
    pathname.startsWith(`${watchPrefix}`)
  );
}

/** Minimal table shape from `arena_table` WebSocket payload. */
export function arenaTableFromActivityDetail(detail) {
  if (!detail?.tableId || !detail?.metaGame) {
    return null;
  }
  const seatUserIds = detail.seatUserIds ?? [];
  return {
    tableId: detail.tableId,
    metaGame: detail.metaGame,
    state: detail.tableState,
    seats: seatUserIds.map((userId) => ({ userId: userId || "" })),
  };
}
