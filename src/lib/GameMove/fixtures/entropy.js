/**
 * Entropy simultaneous-game states from dev game
 * a69da700-5c78-428d-a262-7886172dfad5 (order phase on top of stack).
 */
export const ENTROPY_ORDER_STATE =
  '{"game":"entropy","numplayers":2,"variants":[],"gameover":false,"winner":[],"stack":[{"_version":"20211101","_results":[],"_timestamp":"2026-08-13T19:00:33.886Z","lastmove":[],"bag":["RD","VT","BN","GN","GN","RD","VT","BU","BU","BN","OG","OG","GN","OG","GN","OG","BN","YE","YE","OG","VT","GN","RD","BU","YE","BU","OG","BN","RD","BU","RD","BU","YE","RD","VT","BU","YE","BN","YE","VT","GN","GN","VT","BN","OG","VT","RD","YE","BN"],"board1":{"dataType":"Map","value":[]},"board2":{"dataType":"Map","value":[]},"phase":"chaos"},{"_version":"20211101","_results":[{"type":"place","what":"BN","where":"d4"},{"type":"place","what":"BN","where":"d5"}],"_timestamp":"2026-08-13T19:01:17.696Z","lastmove":["BNd4","BNd5"],"board1":{"dataType":"Map","value":[["d5","BN"]]},"board2":{"dataType":"Map","value":[["d4","BN"]]},"phase":"order","bag":["RD","BN","GN","BN","BU","VT","VT","BU","BU","YE","BN","GN","OG","YE","OG","RD","VT","OG","RD","VT","OG","YE","YE","GN","RD","BN","GN","VT","BU","YE","GN","BU","OG","YE","OG","VT","GN","BU","YE","RD","BN","RD","GN","RD","VT","OG","BN","BU"]}]}';


/**
 * Dev game 42f4644e-7ade-495d-aea1-8340c76066ef — move-table round-grid regression.
 * https://play.dev.abstractplay.com/move/entropy/1/42f4644e-7ade-495d-aea1-8340c76066ef?move=7
 */
export const ENTROPY_DEV_MOVE_TABLE_STATE =
  "{\"game\":\"entropy\",\"numplayers\":2,\"variants\":[],\"gameover\":true,\"winner\":[2],\"stack\":[{\"_version\":\"20211101\",\"_results\":[],\"_timestamp\":\"2024-02-03T00:02:11.791Z\",\"lastmove\":[],\"bag\":[\"OG\",\"RD\",\"BN\",\"YE\",\"RD\",\"YE\",\"BU\",\"GN\",\"GN\",\"VT\",\"RD\",\"VT\",\"BN\",\"GN\",\"YE\",\"RD\",\"BN\",\"OG\",\"RD\",\"OG\",\"BU\",\"VT\",\"YE\",\"GN\",\"OG\",\"BN\",\"OG\",\"VT\",\"BU\",\"GN\",\"RD\",\"BN\",\"BN\",\"BU\",\"YE\",\"BN\",\"BU\",\"BU\",\"VT\",\"VT\",\"YE\",\"GN\",\"RD\",\"GN\",\"OG\",\"OG\",\"VT\",\"BU\",\"YE\"],\"board1\":{\"dataType\":\"Map\",\"value\":[]},\"board2\":{\"dataType\":\"Map\",\"value\":[]},\"phase\":\"chaos\"},{\"_version\":\"20211101\",\"_results\":[{\"type\":\"place\",\"what\":\"YE\",\"where\":\"d4\"},{\"type\":\"place\",\"what\":\"YE\",\"where\":\"d4\"}],\"_timestamp\":\"2024-02-03T00:03:17.303Z\",\"lastmove\":[\"YEd4\",\"YEd4\"],\"board1\":{\"dataType\":\"Map\",\"value\":[[\"d4\",\"YE\"]]},\"board2\":{\"dataType\":\"Map\",\"value\":[[\"d4\",\"YE\"]]},\"phase\":\"order\",\"bag\":[\"BN\",\"VT\",\"RD\",\"BU\",\"YE\",\"RD\",\"YE\",\"GN\",\"VT\",\"OG\",\"YE\",\"BU\",\"RD\",\"VT\",\"BN\",\"RD\",\"VT\",\"GN\",\"YE\",\"RD\",\"BU\",\"OG\",\"OG\",\"BU\",\"OG\",\"YE\",\"OG\",\"GN\",\"BU\",\"BN\",\"OG\",\"RD\",\"VT\",\"BN\",\"GN\",\"GN\",\"BN\",\"VT\",\"YE\",\"VT\",\"BU\",\"BU\",\"OG\",\"RD\",\"BN\",\"BN\",\"GN\",\"GN\"]},{\"_version\":\"20211101\",\"_results\":[{\"type\":\"move\",\"from\":\"d4\",\"to\":\"d7\"},{\"type\":\"move\",\"from\":\"d4\",\"to\":\"g4\"}],\"_timestamp\":\"2024-02-03T00:56:06.277Z\",\"lastmove\":[\"d4-d7\",\"d4-g4\"],\"board1\":{\"dataType\":\"Map\",\"value\":[[\"d7\",\"YE\"]]},\"board2\":{\"dataType\":\"Map\",\"value\":[[\"g4\",\"YE\"]]},\"phase\":\"chaos\",\"bag\":[\"RD\",\"RD\",\"BU\",\"BU\",\"OG\",\"VT\",\"OG\",\"GN\",\"YE\",\"GN\",\"BN\",\"OG\",\"VT\",\"GN\",\"BN\",\"VT\",\"BN\",\"GN\",\"RD\",\"BU\",\"YE\",\"YE\",\"RD\",\"VT\",\"OG\",\"GN\",\"GN\",\"BN\",\"OG\",\"RD\",\"YE\",\"BN\",\"BU\",\"VT\",\"YE\",\"YE\",\"BU\",\"RD\",\"BU\",\"BU\",\"VT\",\"OG\",\"RD\",\"BN\",\"VT\",\"GN\",\"OG\",\"BN\"]},{\"_version\":\"20211101\",\"_results\":[{\"type\":\"place\",\"what\":\"BN\",\"where\":\"d3\"},{\"type\":\"place\",\"what\":\"BN\",\"where\":\"a3\"}],\"_timestamp\":\"2024-02-03T02:05:33.005Z\",\"lastmove\":[\"BNd3\",\"BNa3\"],\"board1\":{\"dataType\":\"Map\",\"value\":[[\"d7\",\"YE\"],[\"a3\",\"BN\"]]},\"board2\":{\"dataType\":\"Map\",\"value\":[[\"g4\",\"YE\"],[\"d3\",\"BN\"]]},\"phase\":\"order\",\"bag\":[\"GN\",\"RD\",\"VT\",\"BU\",\"BU\",\"BN\",\"RD\",\"YE\",\"BU\",\"VT\",\"RD\",\"YE\",\"VT\",\"OG\",\"VT\",\"VT\",\"YE\",\"GN\",\"VT\",\"RD\",\"OG\",\"OG\",\"BU\",\"GN\",\"YE\",\"VT\",\"GN\",\"YE\",\"BN\",\"BN\",\"BN\",\"RD\",\"OG\",\"OG\",\"GN\",\"YE\",\"OG\",\"BN\",\"RD\",\"RD\",\"OG\",\"GN\",\"GN\",\"BU\",\"BU\",\"BU\",\"BN\"]},{\"_version\":\"20211101\",\"_results\":[{\"type\":\"move\",\"from\":\"a3\",\"to\":\"g3\"},{\"type\":\"move\",\"from\":\"d3\",\"to\":\"d7\"}],\"_timestamp\":\"2024-02-03T02:05:53.870Z\",\"lastmove\":[\"a3-g3\",\"d3-d7\"],\"board1\":{\"dataType\":\"Map\",\"value\":[[\"d7\",\"YE\"],[\"g3\",\"BN\"]]},\"board2\":{\"dataType\":\"Map\",\"value\":[[\"g4\",\"YE\"],[\"d7\",\"BN\"]]},\"phase\":\"chaos\",\"bag\":[\"BU\",\"OG\",\"YE\",\"BN\",\"YE\",\"RD\",\"VT\",\"GN\",\"BN\",\"RD\",\"VT\",\"OG\",\"VT\",\"OG\",\"VT\",\"GN\",\"BU\",\"BU\",\"OG\",\"RD\",\"GN\",\"YE\",\"YE\",\"BU\",\"BN\",\"VT\",\"YE\",\"BN\",\"BU\",\"BN\",\"VT\",\"RD\",\"BN\",\"RD\",\"VT\",\"GN\",\"OG\",\"OG\",\"BU\",\"OG\",\"YE\",\"RD\",\"GN\",\"GN\",\"GN\",\"BU\",\"RD\"]},{\"_version\":\"20211101\",\"_results\":[{\"type\":\"place\",\"what\":\"RD\",\"where\":\"d5\"},{\"type\":\"place\",\"what\":\"RD\",\"where\":\"d3\"}],\"_timestamp\":\"2024-02-03T02:06:27.845Z\",\"lastmove\":[\"RDd5\",\"RDd3\"],\"board1\":{\"dataType\":\"Map\",\"value\":[[\"d7\",\"YE\"],[\"g3\",\"BN\"],[\"d3\",\"RD\"]]},\"board2\":{\"dataType\":\"Map\",\"value\":[[\"g4\",\"YE\"],[\"d7\",\"BN\"],[\"d5\",\"RD\"]]},\"phase\":\"order\",\"bag\":[\"GN\",\"GN\",\"OG\",\"OG\",\"BN\",\"VT\",\"OG\",\"GN\",\"GN\",\"OG\",\"RD\",\"BU\",\"BU\",\"YE\",\"YE\",\"RD\",\"OG\",\"VT\",\"BU\",\"VT\",\"VT\",\"BN\",\"RD\",\"GN\",\"BU\",\"BN\",\"RD\",\"BN\",\"VT\",\"OG\",\"GN\",\"GN\",\"BN\",\"YE\",\"YE\",\"RD\",\"BU\",\"BU\",\"BN\",\"BU\",\"YE\",\"VT\",\"OG\",\"VT\",\"YE\",\"RD\"]},{\"_version\":\"20211101\",\"_results\":[{\"type\":\"move\",\"from\":\"d3\",\"to\":\"a3\"},{\"type\":\"move\",\"from\":\"d5\",\"to\":\"a5\"}],\"_timestamp\":\"2024-02-03T02:06:47.243Z\",\"lastmove\":[\"d3-a3\",\"d5-a5\"],\"board1\":{\"dataType\":\"Map\",\"value\":[[\"d7\",\"YE\"],[\"g3\",\"BN\"],[\"a3\",\"RD\"]]},\"board2\":{\"dataType\":\"Map\",\"value\":[[\"g4\",\"YE\"],[\"d7\",\"BN\"],[\"a5\",\"RD\"]]},\"phase\":\"chaos\",\"bag\":[\"BU\",\"OG\",\"BU\",\"BU\",\"RD\",\"VT\",\"BN\",\"RD\",\"RD\",\"GN\",\"RD\",\"GN\",\"GN\",\"VT\",\"BN\",\"VT\",\"BN\",\"BU\",\"BN\",\"OG\",\"GN\",\"GN\",\"OG\",\"YE\",\"OG\",\"VT\",\"YE\",\"GN\",\"YE\",\"VT\",\"RD\",\"OG\",\"BU\",\"YE\",\"RD\",\"BU\",\"OG\",\"OG\",\"GN\",\"VT\",\"VT\",\"BU\",\"YE\",\"YE\",\"BN\",\"BN\"]},{\"_version\":\"20211101\",\"_results\":[{\"type\":\"resigned\",\"player\":1},{\"type\":\"eog\"},{\"type\":\"winners\",\"players\":[2]}],\"_timestamp\":\"2024-02-03T02:06:53.118Z\",\"lastmove\":[\"resign\",\"\"],\"board1\":{\"dataType\":\"Map\",\"value\":[[\"d7\",\"YE\"],[\"g3\",\"BN\"],[\"a3\",\"RD\"]]},\"board2\":{\"dataType\":\"Map\",\"value\":[[\"g4\",\"YE\"],[\"d7\",\"BN\"],[\"a5\",\"RD\"]]},\"phase\":\"chaos\",\"bag\":[\"BU\",\"OG\",\"BU\",\"BU\",\"RD\",\"VT\",\"BN\",\"RD\",\"RD\",\"GN\",\"RD\",\"GN\",\"GN\",\"VT\",\"BN\",\"VT\",\"BN\",\"BU\",\"BN\",\"OG\",\"GN\",\"GN\",\"OG\",\"YE\",\"OG\",\"VT\",\"YE\",\"GN\",\"YE\",\"VT\",\"RD\",\"OG\",\"BU\",\"YE\",\"RD\",\"BU\",\"OG\",\"OG\",\"GN\",\"VT\",\"VT\",\"BU\",\"YE\",\"YE\",\"BN\",\"BN\"]}]}";

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
