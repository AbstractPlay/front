import { create } from "zustand";

export const useStore = create((set, get) => ({
  authSession: {
    status: "unknown",
    token: null,
    userId: null,
    username: null,
    email: null,
  },
  setAuthSession: (session) =>
    set((state) => ({
      authSession: { ...state.authSession, ...session },
    })),
  clearAuthSession: () =>
    set({
      authSession: {
        status: "guest",
        token: null,
        userId: null,
        username: null,
        email: null,
      },
    }),

  globalMe: null,
  setGlobalMe: (me) =>
    set((state) => ({
      globalMe: typeof me === "function" ? me(state.globalMe) : me,
    })),
  updateGlobalMe: (updates) =>
    set((state) => ({
      globalMe: state.globalMe ? { ...state.globalMe, ...updates } : null,
    })),
  updateMySettings: (settingsUpdates) =>
    set((state) => ({
      globalMe: state.globalMe
        ? {
            ...state.globalMe,
            settings: {
              ...state.globalMe.settings,
              ...settingsUpdates,
            },
          }
        : null,
    })),

  users: [],
  usersLoaded: false,
  setUsers: (users) =>
    set((state) => ({
      users: typeof users === "function" ? users(state.users) : users,
    })),
  setUsersLoaded: (usersLoaded) =>
    set((state) => ({
      usersLoaded:
        typeof usersLoaded === "function"
          ? usersLoaded(state.usersLoaded)
          : usersLoaded,
    })),

  news: [],
  setNews: (news) =>
    set((state) => ({
      news: typeof news === "function" ? news(state.news) : news,
    })),

  summary: null,
  /** Site tier (`_summary-site.json`); mirrors legacy bootstrap gate. */
  summaryLoadState: "idle",
  summarySiteLoadState: "idle",
  summaryPlayersLoadState: "idle",
  summaryRatingsLoadState: "idle",
  setSummary: (summary) =>
    set((state) => {
      const nextSummary =
        typeof summary === "function" ? summary(state.summary) : summary;
      return {
        summary: nextSummary,
        summaryLoadState:
          nextSummary !== null && nextSummary !== undefined
            ? "ready"
            : state.summaryLoadState,
      };
    }),
  setSummaryLoadState: (loadState) =>
    set((state) => ({
      summaryLoadState:
        typeof loadState === "function"
          ? loadState(state.summaryLoadState)
          : loadState,
    })),

  colourContext: {
    background: "#fff",
    strokes: "#000",
    borders: "#000",
    labels: "#000",
    annotations: "#000",
    fill: "#000",
  },
  setColourContext: (context) =>
    set((state) => ({
      colourContext:
        typeof context === "function" ? context(state.colourContext) : context,
    })),

  connections: {
    totalCount: 0,
    visibleUserIds: [],
    seq: 0,
  },
  setConnections: (connections) =>
    set((state) => ({
      connections:
        typeof connections === "function"
          ? connections(state.connections)
          : connections,
    })),
  applyPresenceMessage: (msg) => {
    let gap = false;
    set((state) => {
      if (msg.type === "snapshot") {
        return {
          connections: {
            totalCount: msg.totalCount ?? 0,
            visibleUserIds: [...(msg.visibleUserIds ?? [])],
            seq: msg.seq ?? 0,
          },
        };
      }
      if (msg.type === "delta") {
        const lastSeq = state.connections.seq ?? 0;
        if (msg.seq <= lastSeq) {
          return state;
        }
        if (msg.seq > lastSeq + 1) {
          gap = true;
          return state;
        }
        const visible = new Set(state.connections.visibleUserIds);
        const joinedIds = msg.joins ?? [];
        for (const id of msg.leaves ?? []) {
          visible.delete(id);
        }
        for (const id of joinedIds) {
          visible.add(id);
        }
        const now = Date.now();
        const users =
          joinedIds.length > 0
            ? state.users.map((u) =>
                joinedIds.includes(u.id) ? { ...u, lastSeen: now } : u
              )
            : state.users;
        return {
          connections: {
            totalCount: Math.max(
              0,
              state.connections.totalCount +
                (msg.joins?.length ?? 0) -
                (msg.leaves?.length ?? 0)
            ),
            visibleUserIds: [...visible],
            seq: msg.seq,
          },
          users,
        };
      }
      return state;
    });
    return gap;
  },

  wsSend: null,
  setWsSend: (fn) => set({ wsSend: fn }),

  desiredWatchGames: [],
  setDesiredWatchGames: (games) =>
    set({
      desiredWatchGames: Array.isArray(games) ? games : [],
    }),
  syncWatchGames: () => {
    const { wsSend, desiredWatchGames } = get();
    wsSend?.("watchGames", { games: desiredWatchGames });
  },

  invisible: false,
  setInvisible: (val) =>
    set((state) => ({
      invisible: typeof val === "function" ? val(state.invisible) : val,
    })),

  myMove: [],
  setMyMove: (myMove) =>
    set((state) => ({
      myMove: typeof myMove === "function" ? myMove(state.myMove) : myMove,
    })),
}));
