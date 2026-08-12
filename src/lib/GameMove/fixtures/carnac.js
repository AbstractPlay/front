/** Carnac position: one stand placed at e4, tip phase (direction prefix only). */
export const CARNAC_TIP_STATE = JSON.stringify({
  game: "carnac",
  numplayers: 2,
  variants: [],
  gameover: false,
  winner: [],
  stack: [
    {
      _version: "20260707",
      _results: [],
      _timestamp: "2026-07-04T22:40:18.684Z",
      currplayer: 1,
      board: { dataType: "Map", value: [] },
      phase: "place",
      pending: null,
      forcedPass: false,
      reserve: 28,
    },
    {
      _version: "20260707",
      _results: [{ type: "place", where: "e4", what: "21" }],
      _timestamp: "2026-07-04T22:51:27.696Z",
      currplayer: 2,
      board: {
        dataType: "Map",
        value: [["e4", { kind: "stand", orient: "21" }]],
      },
      phase: "tip",
      pending: { cell: "e4", orient: "21", top: 2, placer: 1 },
      forcedPass: false,
      reserve: 27,
      lastmove: "21-e4",
    },
  ],
});

export const carnacContracts = [
  {
    id: "carnac-tip-prefix",
    metaGame: "carnac",
    state: CARNAC_TIP_STATE,
    move: ">e",
    whileEditing: { partial: true, persistable: false },
    afterComplete: { partial: true, persistable: false },
    submitAfterComplete: false,
  },
  {
    id: "carnac-complete-tip",
    metaGame: "carnac",
    state: CARNAC_TIP_STATE,
    move: ">e,11-a7",
    whileEditing: { partial: false, persistable: true },
    afterComplete: { partial: false, persistable: true },
    submitAfterComplete: true,
  },
];
