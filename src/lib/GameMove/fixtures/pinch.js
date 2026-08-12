/**
 * Pinch mid-game state where F7 (row 2, col 5) is a partial placement click.
 * From production game 9c127503-e708-4263-9798-a31eac3d42a4.
 */
export const PINCH_MIDGAME_STATE =
  '{"game":"pinch","numplayers":2,"variants":["size-9"],"gameover":false,"winner":[],"stack":[{"_version":"20260423","_results":[],"_timestamp":"2026-08-09T11:01:08.373Z","currplayer":1,"board":{"dataType":"Map","value":[]},"connPath":[]},{"_version":"20260423","_results":[{"type":"place","where":"i7"}],"_timestamp":"2026-08-09T11:01:21.997Z","currplayer":2,"lastmove":"i7","board":{"dataType":"Map","value":[["i7",1]]},"connPath":[]},{"_version":"20260423","_results":[{"type":"place","where":"e4"}],"_timestamp":"2026-08-09T14:09:03.176Z","currplayer":1,"lastmove":"e4","board":{"dataType":"Map","value":[["i7",1],["e4",2]]},"connPath":[]},{"_version":"20260423","_results":[{"type":"place","where":"g4"}],"_timestamp":"2026-08-09T14:23:09.529Z","currplayer":2,"lastmove":"g4","board":{"dataType":"Map","value":[["i7",1],["e4",2],["g4",1]]},"connPath":[]},{"_version":"20260423","_results":[{"type":"place","where":"g6"}],"_timestamp":"2026-08-10T13:52:39.170Z","currplayer":1,"lastmove":"g6","board":{"dataType":"Map","value":[["i7",1],["e4",2],["g4",1],["g6",2]]},"connPath":[]},{"_version":"20260423","_results":[{"type":"place","where":"h5"}],"_timestamp":"2026-08-10T21:52:07.401Z","currplayer":2,"lastmove":"h5","board":{"dataType":"Map","value":[["i7",1],["e4",2],["g4",1],["g6",2],["h5",1]]},"connPath":[]},{"_version":"20260423","_results":[{"type":"place","where":"h8"}],"_timestamp":"2026-08-10T22:26:09.965Z","currplayer":1,"lastmove":"h8","board":{"dataType":"Map","value":[["i7",1],["e4",2],["g4",1],["g6",2],["h5",1],["h8",2]]},"connPath":[]},{"_version":"20260423","_results":[{"type":"place","where":"e6"}],"_timestamp":"2026-08-10T22:26:56.638Z","currplayer":2,"lastmove":"e6","board":{"dataType":"Map","value":[["i7",1],["e4",2],["g4",1],["g6",2],["h5",1],["h8",2],["e6",1]]},"connPath":[]},{"_version":"20260423","_results":[{"type":"place","where":"e8"}],"_timestamp":"2026-08-12T18:33:57.320Z","currplayer":1,"lastmove":"e8","board":{"dataType":"Map","value":[["i7",1],["e4",2],["g4",1],["g6",2],["h5",1],["h8",2],["e6",1],["e8",2]]},"connPath":[]},{"_version":"20260423","_results":[{"type":"place","where":"c8"}],"_timestamp":"2026-08-12T18:38:15.895Z","currplayer":2,"lastmove":"c8","board":{"dataType":"Map","value":[["i7",1],["e4",2],["g4",1],["g6",2],["h5",1],["h8",2],["e6",1],["e8",2],["c8",1]]},"connPath":[]},{"_version":"20260423","_results":[{"type":"place","where":"e7"}],"_timestamp":"2026-08-12T18:40:54.113Z","currplayer":1,"lastmove":"e7","board":{"dataType":"Map","value":[["i7",1],["e4",2],["g4",1],["g6",2],["h5",1],["h8",2],["e6",1],["e8",2],["c8",1],["e7",2]]},"connPath":[]}]}';

/** Board click at F7 in PINCH_MIDGAME_STATE yields this partial move. */
export const PINCH_PARTIAL_F7_MOVE = "f7";

export const pinchContracts = [
  {
    id: "pinch-partial-f7",
    metaGame: "pinch",
    state: PINCH_MIDGAME_STATE,
    move: PINCH_PARTIAL_F7_MOVE,
    whileEditing: { partial: true, persistable: true },
    afterComplete: { partial: false, persistable: true },
    submitAfterComplete: true,
  },
];
