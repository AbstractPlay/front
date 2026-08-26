import { gameinfo, GameFactory } from "@abstractplay/gameslib";
import { getGameDisplayName } from "./gameOptions";
import { expandVariants } from "./expandVariants";

const NO_VARIANTS_SUFFIX = "no variants";

/** Resolve a gameslib uid or legacy display name to a meta UID. */
export function resolveMetaUid(metaUidOrDisplayName) {
  if (!metaUidOrDisplayName) {
    return "";
  }
  if (gameinfo.has(metaUidOrDisplayName)) {
    return metaUidOrDisplayName;
  }
  const lower = metaUidOrDisplayName.toLowerCase();
  if (gameinfo.has(lower)) {
    return lower;
  }
  const byName = [...gameinfo.values()].find(
    (g) => g.name === metaUidOrDisplayName || g.name?.toLowerCase() === lower
  );
  return byName?.uid ?? metaUidOrDisplayName;
}

/**
 * Parse summarize map keys (`plays.total[].game`, `metaStats`, `highest[].game`).
 * @returns {{ metaUid: string, variantUids: string[] }}
 */
export function parseSummaryGameKey(gameKey) {
  if (!gameKey || typeof gameKey !== "string") {
    return { metaUid: "", variantUids: [] };
  }

  const paren = gameKey.indexOf(" (");
  if (paren === -1) {
    return { metaUid: resolveMetaUid(gameKey), variantUids: [] };
  }

  const metaPart = gameKey.slice(0, paren);
  const inner = gameKey.endsWith(")") ? gameKey.slice(paren + 2, -1) : "";
  const metaUid = resolveMetaUid(metaPart);
  if (inner === NO_VARIANTS_SUFFIX) {
    return { metaUid, variantUids: [] };
  }
  return {
    metaUid,
    variantUids: inner ? inner.split("|") : [],
  };
}

export function metaUidFromSummaryGameKey(gameKey) {
  return parseSummaryGameKey(gameKey).metaUid;
}

export function matchesSummaryGameKey(gameKey, metaUidOrName) {
  if (metaUidOrName === undefined || metaUidOrName === null) {
    return true;
  }
  const filterUid = resolveMetaUid(metaUidOrName);
  return parseSummaryGameKey(gameKey).metaUid === filterUid;
}

export function formatSummaryGameName(gameKey) {
  const { metaUid } = parseSummaryGameKey(gameKey);
  return getGameDisplayName(metaUid);
}

export function formatVariantUids(metaUid, variantUids, t) {
  if (!variantUids.length) {
    return t ? t("standingChallenge.noVariants") : NO_VARIANTS_SUFFIX;
  }
  try {
    const info = gameinfo.get(metaUid);
    if (info) {
      const engine =
        info.playercounts.length > 1
          ? GameFactory(metaUid, 2, [...variantUids])
          : GameFactory(metaUid, undefined, [...variantUids]);
      const labels = engine?.getVariants?.() ?? [];
      if (labels.length > 0) {
        return labels.join(", ");
      }
    }
  } catch {
    // fall through
  }
  try {
    const labels = expandVariants(metaUid, [...variantUids]);
    if (labels.length > 0) {
      return labels.join(", ");
    }
  } catch {
    // fall through to raw UIDs
  }
  return variantUids.join(", ");
}

/** Human-readable label for a summary or ratings game key. */
export function formatSummaryGameKey(gameKey, t) {
  const { metaUid, variantUids } = parseSummaryGameKey(gameKey);
  const name = getGameDisplayName(metaUid);
  if (!variantUids.length) {
    if (gameKey.includes(` (${NO_VARIANTS_SUFFIX})`)) {
      const noVariants = t
        ? t("standingChallenge.noVariants")
        : NO_VARIANTS_SUFFIX;
      return `${name} (${noVariants})`;
    }
    return name;
  }
  const variants = formatVariantUids(metaUid, variantUids, t);
  return `${name} (${variants})`;
}
