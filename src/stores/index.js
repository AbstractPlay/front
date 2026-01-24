import { create } from 'zustand';

export const useStore = create((set) => ({
//   globalMe: null,
//   setGlobalMe: (me) => set({ globalMe: me }),

//   users: [],
//   setUsers: (users) => set({ users }),

  news: [],
  setNews: (news) => set({ news }),

  summary: null,
  setSummary: (summary) => set({ summary }),

  colourContext: {
    background: "#fff",
    strokes: "#000",
    borders: "#000",
    labels: "#000",
    annotations: "#000",
    fill: "#000",
  },
  setColourContext: (context) => set({ colourContext: context }),

  connections: {
    totalCount: 0,
    visibleUserIds: [],
  },
  setConnections: (connections) => set({ connections }),

  invisible: false,
  setInvisible: (val) => set({ invisible: val }),

//   myMove: null,
//   setMyMove: (move) => set({ myMove: move }),
}));
