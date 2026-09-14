import { compareStrings } from "./compareStrings";
import {
  matchWinRateForChallenge,
  passesMatchCompetitivenessFilter,
} from "./glickoMatchOdds";

/** @typedef {"all" | "week" | "month"} OpponentActivityFilter */
/** @typedef {"all" | "good" | "ideal"} MatchFilterMode */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * @param {OpponentActivityFilter} onlySee
 * @param {number} [now]
 */
export function minSeenFromOnlySee(onlySee, now = Date.now()) {
  if (onlySee === "week") {
    return now - WEEK_MS;
  }
  if (onlySee === "month") {
    return now - MONTH_MS;
  }
  return 0;
}

/**
 * @param {{ lastSeen?: number }} user
 * @param {number} minSeen
 */
export function passesActivityFilter(user, minSeen) {
  const seen = user?.lastSeen ?? 0;
  return seen >= minSeen;
}

/**
 * @param {object} opts
 * @param {Map<string, { rating: number, rd: number }>} opts.highestMap
 * @param {string|null|undefined} opts.globalMeId
 * @param {string} opts.opponentId
 * @param {string|null|undefined} opts.metaGame
 * @param {readonly string[]} opts.variantUids
 * @param {number} opts.numPlayers
 * @param {MatchFilterMode} opts.matchFilter
 * @param {boolean} opts.ratingsReady
 */
export function passesMatchFilterForChallenge({
  highestMap,
  globalMeId,
  opponentId,
  metaGame,
  variantUids,
  numPlayers,
  matchFilter,
  ratingsReady,
}) {
  if (matchFilter === "all") {
    return true;
  }
  if (!metaGame || !globalMeId) {
    return true;
  }
  if (!ratingsReady) {
    return true;
  }
  const p = matchWinRateForChallenge({
    highestMap,
    userId: globalMeId,
    challengerId: opponentId,
    metaUid: metaGame,
    variantUids,
    numPlayers,
    rated: true,
  });
  if (p == null) {
    return false;
  }
  return passesMatchCompetitivenessFilter(p, matchFilter);
}

/**
 * @param {Array<{ id: string, name?: string, lastSeen?: number }>} users
 * @param {{
 *   globalMeId?: string|null,
 *   slotIndex: number,
 *   selectedOpponentIds: Array<string|{ id?: string }|""|null|undefined>,
 *   onlySee?: OpponentActivityFilter,
 *   minSeen?: number,
 *   matchFilter?: MatchFilterMode,
 *   metaGame?: string|null,
 *   variantUids?: readonly string[],
 *   numPlayers?: number,
 *   highestMap?: Map<string, { rating: number, rd: number }>,
 *   ratingsReady?: boolean,
 *   now?: number,
 *   locale?: string,
 * }} opts
 */
export function filterChallengeOpponents(users, opts) {
  const {
    globalMeId,
    slotIndex,
    selectedOpponentIds,
    onlySee = "all",
    matchFilter = "all",
    metaGame = null,
    variantUids = [],
    numPlayers = 2,
    highestMap = new Map(),
    ratingsReady = false,
    now = Date.now(),
    locale = "en",
  } = opts;

  const minSeen =
    opts.minSeen !== undefined
      ? opts.minSeen
      : minSeenFromOnlySee(onlySee, now);

  const currentId = normalizeOpponentId(selectedOpponentIds[slotIndex]);

  const otherSelected = new Set(
    selectedOpponentIds
      .map((entry, i) => (i === slotIndex ? null : normalizeOpponentId(entry)))
      .filter(Boolean)
  );

  const filtered = users.filter((user) => {
    if (!user?.id) {
      return false;
    }
    if (user.id === globalMeId) {
      return false;
    }
    if (otherSelected.has(user.id)) {
      return false;
    }
    if (user.id === currentId) {
      return true;
    }
    if (!passesActivityFilter(user, minSeen)) {
      return false;
    }
    return passesMatchFilterForChallenge({
      highestMap,
      globalMeId,
      opponentId: user.id,
      metaGame,
      variantUids,
      numPlayers,
      matchFilter,
      ratingsReady,
    });
  });

  return [...filtered].sort((a, b) =>
    compareStrings(a.name ?? "", b.name ?? "", locale)
  );
}

/**
 * @param {string|{ id?: string }|""|null|undefined} entry
 */
export function normalizeOpponentId(entry) {
  if (!entry) {
    return "";
  }
  if (typeof entry === "string") {
    return entry;
  }
  return entry.id ?? "";
}

/**
 * @param {Array<{ id: string, name?: string, searchLabel?: string }>} opponents
 * @param {string} query
 */
export function filterOpponentOptionsByQuery(opponents, query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return opponents;
  }
  return opponents.filter((user) => {
    const name = (user.name ?? "").toLowerCase();
    const label = (user.searchLabel ?? name).toLowerCase();
    const id = user.id.toLowerCase();
    return name.includes(q) || label.includes(q) || id.includes(q);
  });
}
