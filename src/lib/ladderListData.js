import { getGameDisplayName } from "./gameOptions";
import { formatVariantsJoined } from "./expandVariants";

/**
 * Map `me_dashboard.ladderMemberships` items to dashboard table rows.
 */
export function dashboardLaddersToRows(memberships, { onVacation = false } = {}) {
  if (!Array.isArray(memberships)) {
    return [];
  }
  return memberships.map((m) => {
    const ladderStatus = m.ladderStatus ?? "active";
    const viewerInPool = m.viewerInPool === true;
    const activeCount = m.activeLadderGameCount ?? 0;
    let poolJoinEligible = false;
    if (m.poolJoinEligible === true) {
      poolJoinEligible = true;
    } else if (m.poolJoinEligible !== false && m.viewerInPool === undefined) {
      poolJoinEligible =
        ladderStatus === "active" && !onVacation && activeCount < 7 && !viewerInPool;
    }
    return {
      ladderId: m.ladderId,
      displayName: m.displayName,
      realMeta: m.metaGame,
      metaGame: getGameDisplayName(m.metaGame, "Unknown"),
      variantUids: [...(m.variants ?? [])],
      variants: formatVariantsJoined(m.metaGame, m.variants),
      points: m.points,
      rank: m.rank,
      activeLadderGameCount: activeCount,
      ladderStatus,
      viewerInPool,
      poolJoinEligible,
    };
  });
}
