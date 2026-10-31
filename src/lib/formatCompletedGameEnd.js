import { formatPlayerDisplayName } from "../components/Bots/botUtils";

/**
 * @param {(key: string, params?: object) => string} tApresults
 * @param {string} key
 * @returns {string | null}
 */
function tryApresultsKey(tApresults, key) {
  const text = tApresults(key);
  return text === key ? null : text;
}

/**
 * @param {object} opts
 * @param {string} opts.metaGame
 * @param {string | undefined} opts.eogReason
 * @param {(key: string, params?: object) => string} opts.tApresults
 * @returns {string}
 */
export function formatEogReasonLabel({ metaGame, eogReason, tApresults }) {
  if (!eogReason) {
    return "";
  }
  return (
    tryApresultsKey(tApresults, `${metaGame}.EOG.${eogReason}`) ??
    tryApresultsKey(tApresults, `_general.EOG.${eogReason}`) ??
    eogReason
  );
}

/**
 * @param {object} opts
 * @param {string | undefined} opts.metaGame
 * @param {string | undefined} opts.gameEndKind
 * @param {number | undefined} opts.gameEndPlayer
 * @param {string | undefined} opts.eogReason
 * @param {{ id: string; name?: string }[] | undefined} opts.players
 * @param {object[] | null | undefined} opts.allUsers
 * @param {(key: string, params?: object) => string} opts.t
 * @param {(key: string, params?: object) => string} opts.tApresults
 * @returns {string}
 */
export function formatCompletedGameEnd({
  metaGame,
  gameEndKind,
  gameEndPlayer,
  eogReason,
  players,
  allUsers,
  t,
  tApresults,
}) {
  if (!gameEndKind) {
    return "";
  }

  const seatName =
    gameEndPlayer !== undefined && players?.[gameEndPlayer - 1]
      ? formatPlayerDisplayName(players[gameEndPlayer - 1], allUsers)
      : undefined;

  switch (gameEndKind) {
    case "resign":
      return seatName
        ? t("listGames.end.resignBy", { player: seatName })
        : t("listGames.end.resign");
    case "timeout":
      return seatName
        ? t("listGames.end.timeoutBy", { player: seatName })
        : t("listGames.end.timeout");
    case "abandoned":
      return t("listGames.end.abandoned");
    case "draw":
      return t("listGames.end.draw");
    case "normal":
      return metaGame
        ? formatEogReasonLabel({ metaGame, eogReason, tApresults })
        : eogReason ?? "";
    default:
      return "";
  }
}
