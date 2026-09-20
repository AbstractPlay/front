import {
  expandVariantLabels,
  GameFactory,
  gameinfo,
  variantUidsForBatchRating,
} from "@abstractplay/gameslib";

/** @param {Map<string, string | undefined>} varId2Group */
function compareVariantUidsForDisplay(a, b, varId2Group) {
  const ga = varId2Group.get(a);
  const gb = varId2Group.get(b);
  if (ga !== undefined && gb !== undefined) {
    const byGroup = ga.localeCompare(gb);
    if (byGroup !== 0) {
      return byGroup;
    }
    return a.localeCompare(b);
  }
  if (ga !== undefined) {
    return -1;
  }
  if (gb !== undefined) {
    return 1;
  }
  return a.localeCompare(b);
}

function variantMapsForMeta(metaUid, numPlayers) {
  const info = gameinfo.get(metaUid);
  if (!info) {
    return undefined;
  }
  const engine =
    info.playercounts.length > 1
      ? GameFactory(metaUid, numPlayers > 0 ? numPlayers : 2, [])
      : GameFactory(metaUid, undefined, []);
  const all = engine?.allvariants?.();
  if (!all?.length) {
    return undefined;
  }
  return {
    varId2Group: new Map(all.map((rec) => [rec.uid, rec.group])),
  };
}

/**
 * Sort explicit variant UIDs for display (no default-group fill).
 * Group names lexicographically, then ungrouped uids lexicographically.
 */
export function orderVariantUidsForDisplay(metaUid, variantUids, numPlayers = 2) {
  if (!variantUids.length) {
    return [];
  }
  const maps = variantMapsForMeta(metaUid, numPlayers);
  if (!maps) {
    return [...variantUids].sort((a, b) => a.localeCompare(b));
  }
  return [...variantUids].sort((a, b) =>
    compareVariantUidsForDisplay(a, b, maps.varId2Group)
  );
}

/**
 * Stable variant UID order with default-group fill (batch ratings / pool keys).
 * @param {string} metaUid
 * @param {readonly string[]} variantUids
 * @param {number} [numPlayers=2]
 * @returns {string[]}
 */
export function canonicalVariantUids(metaUid, variantUids, numPlayers = 2) {
  if (!metaUid) {
    return [...variantUids].sort((a, b) => a.localeCompare(b));
  }
  const defs = gameinfo.get(metaUid)?.variants;
  if (defs !== undefined && defs.length > 0) {
    return variantUidsForBatchRating(metaUid, numPlayers, variantUids);
  }
  return [...variantUids].sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string} metaGame
 * @param {string[]} vars
 * @returns {string[]}
 */
export function expandVariants(metaGame, vars) {
  const playerCount = 2;
  return expandVariantLabels(metaGame, playerCount, vars ?? []);
}

/**
 * @param {string} metaGame
 * @param {readonly string[]} vars
 * @param {string} [separator=", "]
 */
export function formatVariantsJoined(metaGame, vars, separator = ", ") {
  return expandVariants(metaGame, vars ?? []).join(separator);
}

/** Canonical variant UIDs joined for stable keys (tournaments, records). */
export function canonicalVariantKey(metaUid, variantUids, numPlayers = 2) {
  return canonicalVariantUids(metaUid, variantUids, numPlayers).join("|");
}
