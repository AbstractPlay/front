import { formatChatLogEntryNodes } from "@abstractplay/gameslib";
import i18n from "../i18n";

/**
 * Build move-log rows from a game engine ({ time, log, ply }).
 */
export function buildEngineMoveResults(engine, playerNames) {
  const names =
    engine.numplayers === 1 && playerNames.length > 0
      ? [playerNames[0]]
      : playerNames;

  const nodes = formatChatLogEntryNodes(
    engine.chatLogEntries(names),
    names,
    (key, params) => i18n.t(key, params),
  );
  const rows = nodes
    .map((e) => ({
      time: e[0],
      log: e.slice(1).join(" ").trim(),
    }))
    .filter((row) => row.log.length > 0);

  return rows
    .map((row, idx) => ({
      ...row,
      ply: idx + 1,
    }))
    .reverse();
}
