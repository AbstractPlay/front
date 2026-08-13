/**
 * Entropy simultaneous-game states from dev game
 * a69da700-5c78-428d-a262-7886172dfad5 (order phase on top of stack).
 */
export const ENTROPY_ORDER_STATE =
  '{"game":"entropy","numplayers":2,"variants":[],"gameover":false,"winner":[],"stack":[{"_version":"20211101","_results":[],"_timestamp":"2026-08-13T19:00:33.886Z","lastmove":[],"bag":["RD","VT","BN","GN","GN","RD","VT","BU","BU","BN","OG","OG","GN","OG","GN","OG","BN","YE","YE","OG","VT","GN","RD","BU","YE","BU","OG","BN","RD","BU","RD","BU","YE","RD","VT","BU","YE","BN","YE","VT","GN","GN","VT","BN","OG","VT","RD","YE","BN"],"board1":{"dataType":"Map","value":[]},"board2":{"dataType":"Map","value":[]},"phase":"chaos"},{"_version":"20211101","_results":[{"type":"place","what":"BN","where":"d4"},{"type":"place","what":"BN","where":"d5"}],"_timestamp":"2026-08-13T19:01:17.696Z","lastmove":["BNd4","BNd5"],"board1":{"dataType":"Map","value":[["d5","BN"]]},"board2":{"dataType":"Map","value":[["d4","BN"]]},"phase":"order","bag":["RD","BN","GN","BN","BU","VT","VT","BU","BU","YE","BN","GN","OG","YE","OG","RD","VT","OG","RD","VT","OG","YE","YE","GN","RD","BN","GN","VT","BU","YE","GN","BU","OG","YE","OG","VT","GN","BU","YE","RD","BN","RD","GN","RD","VT","OG","BN","BU"]}]}';

export const ENTROPY_CHAOS_STATE =
  '{"game":"entropy","numplayers":2,"variants":[],"gameover":false,"winner":[],"stack":[{"_version":"20211101","_results":[],"_timestamp":"2026-08-13T19:00:33.886Z","lastmove":[],"bag":["RD","VT","BN","GN","GN","RD","VT","BU","BU","BN","OG","OG","GN","OG","GN","OG","BN","YE","YE","OG","VT","GN","RD","BU","YE","BU","OG","BN","RD","BU","RD","BU","YE","RD","VT","BU","YE","BN","YE","VT","GN","GN","VT","BN","OG","VT","RD","YE","BN"],"board1":{"dataType":"Map","value":[]},"board2":{"dataType":"Map","value":[]},"phase":"chaos"}]}';

const SIM = {
  simultaneous: true,
  playerIndex: 0,
  numPlayers: 2,
};

export const entropyContracts = [
  {
    id: "entropy-order-partial-d5",
    metaGame: "entropy",
    state: ENTROPY_ORDER_STATE,
    move: "d5",
    ...SIM,
    whileEditing: { partial: true, persistable: false },
    afterComplete: { partial: true, persistable: false },
    submitAfterComplete: false,
  },
  {
    id: "entropy-order-complete-d5-d4",
    metaGame: "entropy",
    state: ENTROPY_ORDER_STATE,
    move: "d5-d4",
    ...SIM,
    whileEditing: { partial: false, persistable: true },
    afterComplete: { partial: false, persistable: true },
    submitAfterComplete: true,
  },
  {
    id: "entropy-chaos-placement-d4",
    metaGame: "entropy",
    state: ENTROPY_CHAOS_STATE,
    move: "d4",
    ...SIM,
    whileEditing: { partial: false, persistable: true },
    afterComplete: { partial: false, persistable: true },
    submitAfterComplete: true,
  },
];
