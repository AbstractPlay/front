/**
 * @param {unknown[]} allRecs
 * @param {string} myUserId
 * @param {number} limit
 * @returns {{ id: string, count: number }[]}
 */
export function buildMostPlayedOpponentPicks(allRecs, myUserId, limit = 5) {
  if (!myUserId || !Array.isArray(allRecs) || allRecs.length === 0) {
    return [];
  }
  const countMap = new Map();
  for (const rec of allRecs) {
    const players = rec?.header?.players;
    if (!Array.isArray(players)) {
      continue;
    }
    const myResult = players.find((p) => p.userid === myUserId)?.result;
    if (myResult === undefined) {
      continue;
    }
    for (const player of players) {
      if (player.userid === myUserId) {
        continue;
      }
      const id = player.userid;
      if (!id) {
        continue;
      }
      countMap.set(id, (countMap.get(id) ?? 0) + 1);
    }
  }
  return [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}

/**
 * @param {unknown[]} allRecs
 * @param {string} myUserId
 * @param {number} limit
 * @returns {{ id: string }[]}
 */
export function buildRecentOpponentPicks(allRecs, myUserId, limit = 5) {
  if (!myUserId || !Array.isArray(allRecs) || allRecs.length === 0) {
    return [];
  }
  const sorted = [...allRecs].sort((a, b) => {
    const aDate = new Date(a?.header?.["date-end"] ?? 0).getTime();
    const bDate = new Date(b?.header?.["date-end"] ?? 0).getTime();
    return bDate - aDate;
  });
  const picks = [];
  const seen = new Set();
  for (const rec of sorted) {
    const players = rec?.header?.players;
    if (!Array.isArray(players)) {
      continue;
    }
    const myResult = players.find((p) => p.userid === myUserId)?.result;
    if (myResult === undefined) {
      continue;
    }
    for (const player of players) {
      if (player.userid === myUserId || !player.userid || seen.has(player.userid)) {
        continue;
      }
      seen.add(player.userid);
      picks.push({ id: player.userid });
      if (picks.length >= limit) {
        return picks;
      }
    }
  }
  return picks;
}

const DEFAULT_LIMITS = {
  mostPlayed: 5,
  recent: 5,
};

const SECTION_LABEL_KEYS = {
  mostPlayed: "playerPicker.quickPicks.mostPlayed",
  recent: "playerPicker.quickPicks.recent",
};

/**
 * @param {{
 *   allRecs?: unknown[]|null,
 *   myUserId?: string|null,
 *   limits?: Partial<typeof DEFAULT_LIMITS>,
 * }} params
 */
export function buildOpponentQuickPickSections({
  allRecs = null,
  myUserId = null,
  limits = {},
} = {}) {
  const mergedLimits = { ...DEFAULT_LIMITS, ...limits };
  if (!myUserId || !Array.isArray(allRecs)) {
    return [];
  }
  const seen = new Set();
  const sections = [];

  const addSection = (key, items) => {
    const unique = [];
    for (const item of items) {
      if (!item?.id || seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      unique.push(item);
    }
    if (unique.length > 0) {
      sections.push({ key, labelKey: SECTION_LABEL_KEYS[key], opponents: unique });
    }
  };

  addSection(
    "mostPlayed",
    buildMostPlayedOpponentPicks(allRecs, myUserId, mergedLimits.mostPlayed)
  );
  addSection(
    "recent",
    buildRecentOpponentPicks(allRecs, myUserId, mergedLimits.recent)
  );

  return sections;
}
