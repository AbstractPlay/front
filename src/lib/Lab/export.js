import { parsePastedState } from "./buildGame";
import {
  sanitizeFocus,
  serializeMainLineAnnotations,
  serializeSessionExploration,
  getMainLineTipState,
} from "./exploration";

export const PLAYGROUND_EXPORT_FORMAT = "abstractplay-playground";

export function serializePlaygroundExport(game, nodes, focus) {
  const safeFocus = sanitizeFocus(nodes, focus);
  const payload = {
    format: PLAYGROUND_EXPORT_FORMAT,
    version: 1,
    metaGame: game.metaGame,
    state: getMainLineTipState(nodes, game),
    variants: game.selectedVariants ?? [],
    playerCount: game.numPlayers,
    focus: {
      moveNumber: safeFocus.moveNumber,
      exPath: [...safeFocus.exPath],
    },
    exploration: serializeSessionExploration(nodes, game.gameOver),
    moveAnnotations: serializeMainLineAnnotations(nodes),
  };
  return JSON.stringify(payload, null, 2);
}

export function parsePlaygroundImport(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Paste a game state to load.");
  }
  if (trimmed.startsWith("{")) {
    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      throw new Error("Could not parse pasted JSON.");
    }
    if (obj.format === PLAYGROUND_EXPORT_FORMAT) {
      if (!obj.metaGame || !obj.state) {
        throw new Error("Playground export is missing game or state.");
      }
      return {
        isPlaygroundExport: true,
        metaGame: obj.metaGame,
        state: obj.state,
        variants: obj.variants ?? [],
        playerCount: obj.playerCount,
        focus: obj.focus ?? null,
        exploration: obj.exploration ?? null,
        moveAnnotations: obj.moveAnnotations ?? null,
      };
    }
  }
  const { metaGame, state } = parsePastedState(raw);
  return {
    isPlaygroundExport: false,
    metaGame,
    state,
    variants: [],
    playerCount: undefined,
    focus: null,
    exploration: null,
    moveAnnotations: null,
  };
}
