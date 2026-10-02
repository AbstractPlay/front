import { getLabBoardSettings, saveLabBoardSettings } from "./storage.js";

/**
 * Persist simultaneous round buffer in Playground board settings (localStorage).
 */

/** * @param {Record<string, unknown> | null | undefined} boardSettings
 */
/**
 * @param {Record<string, unknown> | null | undefined} gameSettings
 */
export function readSimRoundFromGameSettings(gameSettings) {
  if (!gameSettings || typeof gameSettings !== "object") {
    return {};
  }
  return {
    activeSeat:
      typeof gameSettings.simActiveSeat === "number"
        ? gameSettings.simActiveSeat
        : undefined,
    simPartialMove:
      typeof gameSettings.simPartialMove === "string"
        ? gameSettings.simPartialMove
        : undefined,
    simToMove: Array.isArray(gameSettings.simToMove)
      ? gameSettings.simToMove
      : undefined,
  };
}

export function readSimRoundFromBoardSettings(boardSettings) {
  const all = boardSettings?.all ?? {};
  return {
    activeSeat: typeof all.activeSeat === "number" ? all.activeSeat : undefined,
    simPartialMove:
      typeof all.simPartialMove === "string" ? all.simPartialMove : undefined,
    simToMove: Array.isArray(all.simToMove) ? all.simToMove : undefined,
  };
}

/**
 * @param {Record<string, unknown>} settings
 * @param {{ simultaneous?: boolean, labActiveSeat?: number, me?: number, partialMove?: string, toMove?: boolean[] }} game
 */
export function mergeSimRoundIntoBoardSettings(settings, game) {
  if (!game?.simultaneous) {
    return settings;
  }
  const seat = game.labActiveSeat ?? (game.me != null ? game.me + 1 : 1);
  return {
    ...settings,
    all: {
      ...(settings.all ?? {}),
      activeSeat: seat,
      simPartialMove: game.partialMove,
      simToMove: game.toMove,
    },
  };
}

/**
 * @param {{ simultaneous?: boolean, labActiveSeat?: number, me?: number, partialMove?: string, toMove?: boolean[] }} game
 */
export function persistLabSimRound(game) {
  if (!game?.simultaneous) {
    return;
  }
  const next = mergeSimRoundIntoBoardSettings(getLabBoardSettings(), game);
  saveLabBoardSettings(next);
}
