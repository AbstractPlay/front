import {
  GameFactory,
  gameinfo,
  sanitizeVariantSelection,
} from "@abstractplay/gameslib";
import { getGameDisplayName } from "../gameOptions";
import {
  buildGroupData,
  initialGroupVariants,
  initialNonGroupVariants,
} from "../variantSelectionInit";
import { readSimRoundFromBoardSettings } from "./labSimBoardSettings";
import { buildLabGame, getLabPlayerCounts } from "./buildGame";
import { getLabBoardSettings } from "./storage";

function collectActiveVariantUids(groupVariants, nonGroupVariants) {
  const uids = [];
  Object.values(groupVariants).forEach((uid) => {
    if (uid && !uid.startsWith("#")) {
      uids.push(uid);
    }
  });
  Object.keys(nonGroupVariants).forEach((uid) => {
    if (nonGroupVariants[uid]) {
      uids.push(uid);
    }
  });
  return uids;
}

function rootVariantsForMetaGame(metaGame) {
  const info = gameinfoEntry(metaGame);
  if (!info) {
    return null;
  }
  const gameEngine =
    info.playercounts.length > 1
      ? GameFactory(info.uid, 2)
      : GameFactory(info.uid);
  if (typeof gameEngine.challengeVariants === "function") {
    return gameEngine.challengeVariants();
  }
  return gameEngine.allvariants();
}

function gameinfoEntry(metaGame) {
  return gameinfo.get(metaGame);
}

/** @returns {{ groupData: object[], nonGroupData: object[], allVariants: object[] }} */
export function playgroundVariantCatalog(metaGame) {
  const info = gameinfoEntry(metaGame);
  if (!info) {
    return { groupData: [], nonGroupData: [], allVariants: [] };
  }

  const rootAllVariants = rootVariantsForMetaGame(metaGame);
  if (!rootAllVariants) {
    return { groupData: [], nonGroupData: [], allVariants: [] };
  }

  const groupData = buildGroupData(rootAllVariants);
  const nonGroupData = rootAllVariants.filter(
    (v) => v.group === undefined && !v.uid.startsWith("#"),
  );

  return {
    groupData,
    nonGroupData,
    allVariants: rootAllVariants,
  };
}

export function playgroundHasVariantUi(metaGame) {
  const { groupData, nonGroupData } = playgroundVariantCatalog(metaGame);
  return groupData.length > 0 || nonGroupData.length > 0;
}

export function playgroundNeedsLauncherSetup(metaGame) {
  const counts = getLabPlayerCounts(metaGame);
  if (counts.length > 1) {
    return true;
  }
  return playgroundHasVariantUi(metaGame);
}

export function defaultPlaygroundVariantUids(metaGame) {
  const { groupData, nonGroupData, allVariants } =
    playgroundVariantCatalog(metaGame);
  if (allVariants.length === 0) {
    return [];
  }
  const groupVariants = initialGroupVariants(groupData);
  const nonGroupVariants = initialNonGroupVariants(nonGroupData);
  const active = collectActiveVariantUids(groupVariants, nonGroupVariants);
  const sanitized = sanitizeVariantSelection(allVariants, active);
  return sanitized.filter((uid) => !uid.startsWith("#"));
}

export function buildPlaygroundLaunchPath(metaGame) {
  const params = new URLSearchParams({ metaGame });
  return `/playground?${params.toString()}`;
}

/**
 * @param {string} metaGame
 * @param {{ playerCount?: number, variants?: string[] }} [options]
 * @returns {{ game: object, savedExploration: null, gameSettings: object, sessionName: string }}
 */
export function buildFreshPlaygroundSession(metaGame, options = {}) {
  const counts = getLabPlayerCounts(metaGame);
  const count =
    options.playerCount ??
    (counts.length === 1 ? counts[0] : undefined);
  if (!count || !counts.includes(count)) {
    throw new Error("Invalid player count for Playground launch.");
  }
  const variants =
    options.variants ?? defaultPlaygroundVariantUids(metaGame);
  const sim = readSimRoundFromBoardSettings(getLabBoardSettings());
  const game = buildLabGame(metaGame, null, {
    variants,
    numPlayers: count,
    activeSeat: sim.activeSeat,
  });
  return {
    game,
    savedExploration: null,
    gameSettings: {},
    sessionName: getGameDisplayName(metaGame),
  };
}
