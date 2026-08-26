/** Jacynth mid-game: optional influence on card placement (5ml-e1). */
export const JACYNTH_STATE = JSON.stringify({
  game: "jacynth",
  numplayers: 2,
  variants: [],
  gameover: false,
  winner: [],
  stack: [
    {
      _version: "20241212",
      _results: [],
      _timestamp: "2026-08-12T03:02:19.512Z",
      currplayer: 1,
      board: {
        dataType: "Map",
        value: [
          ["a6", "4VL"],
          ["b5", "NL"],
          ["c4", "6SY"],
          ["d3", "9LK"],
          ["e2", "6MV"],
          ["f1", "5YK"],
        ],
      },
      claimed: { dataType: "Map", value: [] },
      influence: [4, 4],
      hands: [
        ["5ML", "2SY", "1L"],
        ["7VY", "7ML", "2VL"],
      ],
    },
  ],
});

export const jacynthContracts = [
  {
    id: "jacynth-optional-influence",
    metaGame: "jacynth",
    state: JACYNTH_STATE,
    move: "5ml-e1",
    whileEditing: { partial: true, persistable: true },
    afterComplete: { partial: false, persistable: true },
    submitAfterComplete: true,
  },
];
