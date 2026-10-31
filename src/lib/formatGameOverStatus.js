import { GameFactory } from "@abstractplay/gameslib";
import { formatPlayerDisplayName } from "../components/Bots/botUtils";
import { formatSoloOutcome, isSoloGame } from "./soloPlay";

/**
 * @param {object} opts
 * @param {object} opts.game
 * @param {object} [opts.gameRec]
 * @param {string} opts.metaGame
 * @param {string} opts.nodeState Serialized state at the focused ply.
 * @param {object[]} opts.allUsers
 * @param {(key: string, params?: object) => string} opts.t apfront namespace
 * @param {(key: string, params?: object) => string} opts.tApresults apresults namespace
 * @returns {{ primary: string, detail?: string }}
 */
export function formatGameOverStatus({
  game,
  gameRec,
  metaGame,
  nodeState,
  allUsers,
  t,
  tApresults,
}) {
  if (isSoloGame(game)) {
    return {
      primary: formatSoloOutcome({
        gameRec,
        engine: GameFactory(metaGame, nodeState),
        metaGame,
        t,
      }),
    };
  }

  const state = GameFactory(metaGame, nodeState);
  const playerNames = game.players.map((p) =>
    formatPlayerDisplayName(p, allUsers)
  );
  const detail =
    typeof state.formatEogSummary === "function"
      ? state.formatEogSummary(playerNames, tApresults)
      : undefined;

  if (!state.winner || state.winner.length === 0) {
    if (detail) {
      return {
        primary: t("GameIsOver_reason", { reason: detail }),
      };
    }
    return { primary: t("GameIsOver") };
  }

  if (state.winner.length === 1) {
    const winner = formatPlayerDisplayName(
      game.players[state.winner[0] - 1],
      allUsers
    );
    if (detail) {
      return {
        primary: t("GameIsOver1_reason", { winner, reason: detail }),
      };
    }
    return { primary: t("GameIsOver1", { winner }) };
  }

  const winners = state.winner.map((w) =>
    formatPlayerDisplayName(game.players[w - 1], allUsers)
  );
  const lastWinner = winners.pop();
  const winnersStr = winners.join(", ");
  if (detail) {
    return {
      primary: t("GameIsOver2_reason", {
        winners: winnersStr,
        lastWinner,
        reason: detail,
      }),
    };
  }
  return {
    primary: t("GameIsOver2", { winners: winnersStr, lastWinner }),
  };
}
