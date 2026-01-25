import { create } from "zustand";

export const useStore = create((set) => ({
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
  setUsers: (users) =>
    set((state) => ({
      users: typeof users === "function" ? users(state.users) : users,
    })),

  news: [],
  setNews: (news) =>
    set((state) => ({
      news: typeof news === "function" ? news(state.news) : news,
    })),

  summary: null,
  setSummary: (summary) =>
    set((state) => ({
      summary: typeof summary === "function" ? summary(state.summary) : summary,
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
  },
  setConnections: (connections) =>
    set((state) => ({
      connections:
        typeof connections === "function"
          ? connections(state.connections)
          : connections,
    })),

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
