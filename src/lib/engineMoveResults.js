import { formatChatLogEntryNodes } from "@abstractplay/gameslib";
import i18n from "../i18n";

/**
 * Build move-log rows from a game engine ({ time, log, ply }).
 * Uses structured chatLogEntries when available; otherwise legacy chatLog.
 */
export function buildEngineMoveResults(engine, playerNames) {
  const names =
    engine.numplayers === 1 && playerNames.length > 0
      ? [playerNames[0]]
      : playerNames;

  if (typeof engine.chatLogEntries === "function") {
    return formatChatLogEntryNodes(
      engine.chatLogEntries(names),
      names,
      (key, params) => i18n.t(key, params),
    )
      .map((e, idx) => ({
        time: e[0],
        log: e.slice(1).join(" "),
        ply: idx + 1,
      }))
      .reverse();
  }

  if (typeof engine.chatLog === "function") {
    return engine
      .chatLog(names)
      .map((e, idx) => ({
        time: e[0],
        log: e.slice(1).join(" "),
        ply: idx + 1,
      }))
      .reverse();
  }

  if (typeof engine.resultsHistory === "function") {
    return engine.resultsHistory().reverse();
  }

  return [];
}
