export const FEEDBACK_KINDS = {
  bug: "bug",
  feature: "feature",
  wishlist: "wishlist",
};

export const TERMINAL_STATUSES = {
  bug: ["resolved", "closed"],
  feature: ["shipped", "declined"],
  wishlist: ["available"],
};

export const BUG_STATUSES = [
  "open",
  "triaged",
  "monitoring",
  "resolved",
  "closed",
];

export const FEATURE_STATUSES = [
  "open",
  "under_review",
  "planned",
  "in_progress",
  "shipped",
  "declined",
];

export const EFFORT_LEVELS = ["low", "medium", "high", "unknown"];

export const FEEDBACK_REVIEWER_MAX_COUNT = 8;

export const FEEDBACK_COMMENT_ATTACHMENT_MAX_COUNT = 3;

export const WISHLIST_STATUSES = [
  "requested",
  "evaluating",
  "in_development",
  "available",
];

export const WISHLIST_CATEGORIES = [
  "none",
  "permissions_required",
  "declined",
  "feasible",
  "low_priority",
  "not_feasible",
];

export const WISHLIST_ADMIN_CATEGORIES = [
  "none",
  "permissions_required",
  "declined",
];

export const WISHLIST_CATEGORY_FILTER_CHIPS = [
  "permissions_required",
  "declined",
];

export const PRIORITY_LEVELS = ["urgent", "normal", "low"];

export const PRIORITY_SORT_RANK = {
  urgent: 0,
  normal: 1,
  low: 2,
};

export const BUG_BOARD_PATH = "/feedback/bugs";
export const IDEAS_BOARD_PATH = "/feedback/ideas";
export const FEEDBACK_MINE_PATH = "/feedback/mine";
export const FEEDBACK_ADMIN_PATH = "/feedback/admin";
export const FEEDBACK_NEW_PATH = "/feedback/new";
export const FEEDBACK_HISTORY_PATH = "/feedback/history";

export const FEEDBACK_HISTORY_TABS = [
  { id: "bugs", kind: "bug" },
  { id: "ideas", kind: "feature" },
  { id: "games", kind: "wishlist" },
];

export function historyKindForTab(tab) {
  const entry = FEEDBACK_HISTORY_TABS.find((item) => item.id === tab);
  return entry?.kind ?? "bug";
}

export function historyTabForKind(kind) {
  const entry = FEEDBACK_HISTORY_TABS.find((item) => item.kind === kind);
  return entry?.id ?? "bugs";
}

export function feedbackHistoryPath(tab = "bugs") {
  return tab === "bugs" ? FEEDBACK_HISTORY_PATH : `${FEEDBACK_HISTORY_PATH}/${tab}`;
}

export function boardPathForKind(kind) {
  if (kind === "feature") {
    return IDEAS_BOARD_PATH;
  }
  if (kind === "wishlist") {
    return "/wishlist";
  }
  return BUG_BOARD_PATH;
}

export function statusesForKind(kind) {
  if (kind === "feature") {
    return FEATURE_STATUSES;
  }
  if (kind === "bug") {
    return BUG_STATUSES;
  }
  if (kind === "wishlist") {
    return WISHLIST_STATUSES;
  }
  return [];
}

export function boardStatusFilterChipsForKind(kind) {
  const terminal = TERMINAL_STATUSES[kind] ?? [];
  return statusesForKind(kind).filter((status) => !terminal.includes(status));
}

export function countItemsByStatus(items, statusChips) {
  const counts = { all: items.length };
  for (const chip of statusChips) {
    counts[chip] = items.filter((item) => item.status === chip).length;
  }
  return counts;
}

export function boardKeyForKind(kind) {
  if (kind === "feature") {
    return "ideas";
  }
  if (kind === "wishlist") {
    return "wishlist";
  }
  return "bugs";
}

export function wishlistCategoryLabelKey(category) {
  return `feedback.wishlist.category.${category}`;
}

export function feedbackDetailPath(id) {
  return `/feedback/${id}`;
}

export function feedbackNewPath(kind = "bug", extraParams = {}) {
  const params = new URLSearchParams({ kind, ...extraParams });
  return `${FEEDBACK_NEW_PATH}?${params.toString()}`;
}

export function statusLabelKey(status) {
  return `feedback.status.${status}`;
}

export function effortLabelKey(effort) {
  return `feedback.effort.${effort}`;
}

export function priorityLabelKey(priority) {
  return `feedback.priority.${priority}`;
}

export const WISHLIST_SORT_OPTIONS = ["votes", "recent", "name"];

export const FEEDBACK_BOARD_SORT_OPTIONS = ["votes", "recent"];

export function defaultBoardSortForKind(kind) {
  if (kind === "bug") {
    return "recent";
  }
  if (kind === "feature" || kind === "wishlist") {
    return "votes";
  }
  return "recent";
}

export function feedbackBoardSortLabelKey(option) {
  return `feedback.board.sort${option.charAt(0).toUpperCase()}${option.slice(1)}`;
}

export function compareWishlistItems(a, b, sortBy) {
  if (sortBy === "name") {
    const titleCmp = String(a.title).localeCompare(String(b.title), undefined, { sensitivity: "base" });
    if (titleCmp !== 0) {
      return titleCmp;
    }
    return (b.effectiveVotes ?? 0) - (a.effectiveVotes ?? 0);
  }
  if (sortBy === "recent") {
    const dateDiff = (b.createdAt ?? 0) - (a.createdAt ?? 0);
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return (b.effectiveVotes ?? 0) - (a.effectiveVotes ?? 0);
  }
  const voteDiff = (b.effectiveVotes ?? 0) - (a.effectiveVotes ?? 0);
  if (voteDiff !== 0) {
    return voteDiff;
  }
  return String(a.title).localeCompare(String(b.title), undefined, { sensitivity: "base" });
}

export function compareFeedbackItems(a, b, sortBy) {
  if (sortBy === "recent") {
    const dateDiff = (b.createdAt ?? 0) - (a.createdAt ?? 0);
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return (b.effectiveVotes ?? 0) - (a.effectiveVotes ?? 0);
  }
  if (sortBy === "votes") {
    const voteDiff = (b.effectiveVotes ?? 0) - (a.effectiveVotes ?? 0);
    if (voteDiff !== 0) {
      return voteDiff;
    }
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  }
  if (sortBy === "priority") {
    const rankA = PRIORITY_SORT_RANK[a.priority] ?? 99;
    const rankB = PRIORITY_SORT_RANK[b.priority] ?? 99;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  }
  if (sortBy === "status") {
    const statusCmp = String(a.status).localeCompare(String(b.status));
    if (statusCmp !== 0) {
      return statusCmp;
    }
    return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
  }
  return 0;
}
