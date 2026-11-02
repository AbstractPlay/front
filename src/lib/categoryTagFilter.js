import { isBoardFilterCategory } from "./gameOptions";

/** @typedef {'any' | 'all' | 'none'} TagDimensionMode */
/** @typedef {{ mode: TagDimensionMode, tags: string[] }} TagDimension */
/** @typedef {{ mode: 'any' | 'all', tags: string[] }} TagFilterGroup */
/**
 * @typedef {{
 *   dimensions: Partial<Record<TagDimensionKey, TagDimension>>,
 *   exclude: string[],
 *   groups: TagFilterGroup[],
 * }} TagFilterSpec
 */

/** @typedef {'goal' | 'mech' | 'board' | 'other'} TagDimensionKey */

export const TAG_FILTER_QUERY_VERSION = 2;

export const TAG_DIMENSION_KEYS = /** @type {const} */ ([
  "goal",
  "mech",
  "board",
  "other",
]);

/** @type {TagFilterSpec} */
export const EMPTY_TAG_FILTER_SPEC = {
  dimensions: {},
  exclude: [],
  groups: [],
};

const DIMENSION_QUERY_KEYS = {
  goal: "g",
  mech: "m",
  board: "b",
  other: "o",
};

const MODE_SUFFIX = {
  any: "",
  all: ";a",
  none: ";n",
};

const SUFFIX_TO_MODE = {
  "": "any",
  a: "all",
  n: "none",
};

/**
 * @param {string} raw
 * @returns {TagDimensionKey}
 */
export function classifyCategoryTag(raw) {
  if (raw.startsWith("goal")) {
    return "goal";
  }
  if (raw.startsWith("mech") || raw.startsWith("mechanic")) {
    return "mech";
  }
  if (raw.startsWith("board") || isBoardFilterCategory(raw)) {
    return "board";
  }
  return "other";
}

/**
 * @param {unknown} mode
 * @returns {TagDimensionMode}
 */
function normalizeDimensionMode(mode) {
  if (mode === "all" || mode === "none") {
    return mode;
  }
  return "any";
}

/**
 * @param {unknown} mode
 * @returns {'any' | 'all'}
 */
function normalizeGroupMode(mode) {
  return mode === "all" ? "all" : "any";
}

/**
 * @param {unknown} tags
 * @returns {string[]}
 */
function dedupeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }
  const out = [];
  const seen = new Set();
  for (const tag of tags) {
    if (tag == null || tag === "") {
      continue;
    }
    const s = String(tag);
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

/**
 * @param {Partial<TagFilterSpec> | null | undefined} raw
 * @returns {TagFilterSpec}
 */
export function normalizeTagFilterSpec(raw) {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_TAG_FILTER_SPEC, dimensions: {}, exclude: [], groups: [] };
  }
  /** @type {Partial<Record<TagDimensionKey, TagDimension>>} */
  const dimensions = {};
  const rawDims = raw.dimensions;
  if (rawDims && typeof rawDims === "object") {
    for (const key of TAG_DIMENSION_KEYS) {
      const dim = rawDims[key];
      if (!dim || typeof dim !== "object") {
        continue;
      }
      const tags = dedupeTags(dim.tags);
      if (tags.length === 0) {
        continue;
      }
      dimensions[key] = {
        mode: normalizeDimensionMode(dim.mode),
        tags,
      };
    }
  }
  const exclude = dedupeTags(raw.exclude);
  const groups = [];
  if (Array.isArray(raw.groups)) {
    for (const group of raw.groups) {
      if (!group || typeof group !== "object") {
        continue;
      }
      const tags = dedupeTags(group.tags);
      if (tags.length === 0) {
        continue;
      }
      groups.push({
        mode: normalizeGroupMode(group.mode),
        tags,
      });
    }
  }
  return { dimensions, exclude, groups };
}

/**
 * @param {TagFilterSpec} spec
 * @returns {boolean}
 */
export function tagFilterSpecIsActive(spec) {
  const normalized = normalizeTagFilterSpec(spec);
  if (normalized.exclude.length > 0) {
    return true;
  }
  if (normalized.groups.length > 0) {
    return true;
  }
  for (const key of TAG_DIMENSION_KEYS) {
    if (normalized.dimensions[key]?.tags?.length) {
      return true;
    }
  }
  return false;
}

/**
 * @param {Set<string>} categorySet
 * @param {TagDimension} dim
 */
function dimensionMatches(categorySet, dim) {
  const { mode, tags } = dim;
  if (mode === "none") {
    return tags.every((t) => !categorySet.has(t));
  }
  if (mode === "all") {
    return tags.every((t) => categorySet.has(t));
  }
  return tags.some((t) => categorySet.has(t));
}

/**
 * @param {Set<string>} categorySet
 * @param {TagFilterGroup} group
 */
function groupMatches(categorySet, group) {
  if (group.mode === "all") {
    return group.tags.every((t) => categorySet.has(t));
  }
  return group.tags.some((t) => categorySet.has(t));
}

/**
 * @param {string[] | null | undefined} categories
 * @param {TagFilterSpec | null | undefined} spec
 * @returns {boolean}
 */
export function gameMatchesTagFilter(categories, spec) {
  const normalized = normalizeTagFilterSpec(spec);
  if (!tagFilterSpecIsActive(normalized)) {
    return true;
  }
  const categorySet = new Set(categories ?? []);
  for (const tag of normalized.exclude) {
    if (categorySet.has(tag)) {
      return false;
    }
  }
  if (normalized.groups.length > 0) {
    return normalized.groups.some((group) => groupMatches(categorySet, group));
  }
  for (const key of TAG_DIMENSION_KEYS) {
    const dim = normalized.dimensions[key];
    if (dim?.tags?.length && !dimensionMatches(categorySet, dim)) {
      return false;
    }
  }
  return true;
}

/**
 * Legacy flat AND list → spec (all tags on "other", mode all).
 * @param {string[] | null | undefined} flatTags
 * @returns {TagFilterSpec}
 */
export function migrateLegacyFlatTagFilter(flatTags) {
  const tags = dedupeTags(flatTags);
  if (tags.length === 0) {
    return normalizeTagFilterSpec(EMPTY_TAG_FILTER_SPEC);
  }
  return normalizeTagFilterSpec({
    dimensions: { other: { mode: "all", tags } },
    exclude: [],
    groups: [],
  });
}

/**
 * @param {unknown} stored
 * @returns {TagFilterSpec}
 */
export function parseStoredTagFilter(stored) {
  return parseStoredExploreTagFilters(stored).tagFilterSpec;
}

/**
 * @param {unknown} stored
 * @returns {{ quickTag: string, tagFilterSpec: TagFilterSpec }}
 */
export function parseStoredExploreTagFilters(stored) {
  if (!stored || typeof stored !== "object") {
    return { quickTag: "", tagFilterSpec: normalizeTagFilterSpec(EMPTY_TAG_FILTER_SPEC) };
  }
  if ("quickTag" in stored && typeof stored.quickTag === "string") {
    return {
      quickTag: stored.quickTag.trim(),
      tagFilterSpec: normalizeTagFilterSpec(
        stored.tagFilterSpec ?? EMPTY_TAG_FILTER_SPEC
      ),
    };
  }
  if ("tagFilterSpec" in stored && stored.tagFilterSpec) {
    return {
      quickTag: "",
      tagFilterSpec: normalizeTagFilterSpec(stored.tagFilterSpec),
    };
  }
  if (Array.isArray(stored.tagFilter) && stored.tagFilter.length > 0) {
    const tags = dedupeTags(stored.tagFilter);
    if (tags.length === 1) {
      return {
        quickTag: tags[0],
        tagFilterSpec: normalizeTagFilterSpec(EMPTY_TAG_FILTER_SPEC),
      };
    }
    return {
      quickTag: "",
      tagFilterSpec: migrateLegacyFlatTagFilter(tags),
    };
  }
  return { quickTag: "", tagFilterSpec: normalizeTagFilterSpec(EMPTY_TAG_FILTER_SPEC) };
}

/**
 * @param {string[] | null | undefined} categories
 * @param {{ quickTag?: string, spec?: TagFilterSpec | null }} filters
 * @returns {boolean}
 */
export function gameMatchesExploreTagFilters(categories, { quickTag = "", spec } = {}) {
  const qt = quickTag == null ? "" : String(quickTag).trim();
  if (qt !== "") {
    const set = new Set(categories ?? []);
    if (!set.has(qt)) {
      return false;
    }
  }
  return gameMatchesTagFilter(categories, spec);
}

/**
 * @param {TagFilterSpec} spec
 * @returns {number}
 */
export function countAdvancedFilterRules(spec) {
  const normalized = normalizeTagFilterSpec(spec);
  let n = normalized.exclude.length;
  n += normalized.groups.length;
  for (const key of TAG_DIMENSION_KEYS) {
    if (normalized.dimensions[key]?.tags?.length) {
      n += 1;
    }
  }
  return n;
}

/**
 * @param {string} search
 * @returns {{ quickTag: string, tagFilterSpec: TagFilterSpec }}
 */
export function parseExploreTagFiltersFromSearch(search) {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  const quickRaw = params.get("t");
  const quickTag = quickRaw == null ? "" : quickRaw.trim();
  const advanced =
    params.get("tf") === String(TAG_FILTER_QUERY_VERSION)
      ? parseExploreTagQuery(search)
      : null;
  return {
    quickTag,
    tagFilterSpec:
      advanced ?? normalizeTagFilterSpec(EMPTY_TAG_FILTER_SPEC),
  };
}

/**
 * @param {{ quickTag?: string, tagFilterSpec?: TagFilterSpec }} filters
 * @returns {boolean}
 */
export function exploreTagFiltersActive({ quickTag = "", tagFilterSpec } = {}) {
  const qt = quickTag == null ? "" : String(quickTag).trim();
  return qt !== "" || tagFilterSpecIsActive(tagFilterSpec);
}

/**
 * @param {{ quickTag?: string, tagFilterSpec?: TagFilterSpec }} filters
 * @returns {string}
 */
export function serializeExploreTagFiltersQuery(filters) {
  const params = new URLSearchParams();
  const qt =
    filters.quickTag == null ? "" : String(filters.quickTag).trim();
  if (qt !== "") {
    params.set("t", qt);
  }
  const advanced = serializeExploreTagQuery(filters.tagFilterSpec ?? EMPTY_TAG_FILTER_SPEC);
  if (advanced) {
    const advancedParams = new URLSearchParams(advanced);
    for (const [key, value] of advancedParams.entries()) {
      params.set(key, value);
    }
  }
  return params.toString();
}

/**
 * @param {string} search
 * @param {{ quickTag?: string, tagFilterSpec?: TagFilterSpec }} filters
 * @returns {string}
 */
export function mergeExploreTagFiltersIntoSearch(search, filters) {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  params.delete("t");
  params.delete("tf");
  for (const qk of Object.values(DIMENSION_QUERY_KEYS)) {
    params.delete(qk);
  }
  params.delete("x");
  params.delete("grp");
  const serialized = serializeExploreTagFiltersQuery(filters);
  if (serialized) {
    const tagParams = new URLSearchParams(serialized);
    for (const [key, value] of tagParams.entries()) {
      params.set(key, value);
    }
  }
  const out = params.toString();
  return out ? `?${out}` : "";
}

/**
 * Click-to-add: place tag in its dimension with mode **all** (preserves flat AND semantics).
 * @param {TagFilterSpec} spec
 * @param {string} rawTag
 * @returns {TagFilterSpec}
 */
export function addTagToSpecByClick(spec, rawTag) {
  if (!rawTag) {
    return normalizeTagFilterSpec(spec);
  }
  const normalized = normalizeTagFilterSpec(spec);
  if (normalized.groups.length > 0) {
    return normalized;
  }
  const key = classifyCategoryTag(rawTag);
  const existing = normalized.dimensions[key] ?? { mode: "all", tags: [] };
  const tags = dedupeTags([...existing.tags, rawTag]);
  return normalizeTagFilterSpec({
    ...normalized,
    dimensions: {
      ...normalized.dimensions,
      [key]: { mode: "all", tags },
    },
  });
}

/**
 * @param {TagFilterSpec} spec
 * @param {string} rawTag
 * @returns {TagFilterSpec}
 */
export function removeTagFromSpec(spec, rawTag) {
  if (!rawTag) {
    return normalizeTagFilterSpec(spec);
  }
  const normalized = normalizeTagFilterSpec(spec);
  /** @type {Partial<Record<TagDimensionKey, TagDimension>>} */
  const dimensions = {};
  for (const key of TAG_DIMENSION_KEYS) {
    const dim = normalized.dimensions[key];
    if (!dim) {
      continue;
    }
    const tags = dim.tags.filter((t) => t !== rawTag);
    if (tags.length > 0) {
      dimensions[key] = { mode: dim.mode, tags };
    }
  }
  const exclude = normalized.exclude.filter((t) => t !== rawTag);
  const groups = normalized.groups
    .map((group) => ({
      ...group,
      tags: group.tags.filter((t) => t !== rawTag),
    }))
    .filter((group) => group.tags.length > 0);
  return normalizeTagFilterSpec({ dimensions, exclude, groups });
}

/**
 * @param {string} value
 * @returns {{ tags: string[], mode: TagDimensionMode } | null}
 */
function parseDimensionParam(value) {
  if (value == null || value === "") {
    return null;
  }
  let mode = "any";
  let body = value;
  const semi = value.lastIndexOf(";");
  if (semi >= 0) {
    const suffix = value.slice(semi + 1);
    if (suffix in SUFFIX_TO_MODE) {
      mode = SUFFIX_TO_MODE[suffix];
      body = value.slice(0, semi);
    }
  }
  const tags = dedupeTags(body.split(",").map((s) => s.trim()).filter(Boolean));
  if (tags.length === 0) {
    return null;
  }
  return { tags, mode };
}

/**
 * @param {string} search
 * @returns {TagFilterSpec | null}
 */
export function parseExploreTagQuery(search) {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  const version = params.get("tf");
  if (version !== String(TAG_FILTER_QUERY_VERSION)) {
    return null;
  }
  /** @type {Partial<Record<TagDimensionKey, TagDimension>>} */
  const dimensions = {};
  for (const key of TAG_DIMENSION_KEYS) {
    const parsed = parseDimensionParam(params.get(DIMENSION_QUERY_KEYS[key]));
    if (parsed) {
      dimensions[key] = { mode: parsed.mode, tags: parsed.tags };
    }
  }
  const excludeRaw = params.get("x");
  const exclude = excludeRaw
    ? dedupeTags(excludeRaw.split(",").map((s) => s.trim()).filter(Boolean))
    : [];
  /** @type {TagFilterGroup[]} */
  const groups = [];
  const grpRaw = params.get("grp");
  if (grpRaw) {
    try {
      const decoded = decodeURIComponent(grpRaw);
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (!item || typeof item !== "object") {
            continue;
          }
          const tags = dedupeTags(item.tags);
          if (tags.length === 0) {
            continue;
          }
          groups.push({
            mode: normalizeGroupMode(item.mode),
            tags,
          });
        }
      }
    } catch {
      /* ignore malformed grp */
    }
  }
  const spec = normalizeTagFilterSpec({ dimensions, exclude, groups });
  if (!tagFilterSpecIsActive(spec)) {
    return normalizeTagFilterSpec(EMPTY_TAG_FILTER_SPEC);
  }
  return spec;
}

/**
 * @param {TagFilterSpec} spec
 * @returns {string}
 */
export function serializeExploreTagQuery(spec) {
  const normalized = normalizeTagFilterSpec(spec);
  if (!tagFilterSpecIsActive(normalized)) {
    return "";
  }
  const params = new URLSearchParams();
  params.set("tf", String(TAG_FILTER_QUERY_VERSION));
  for (const key of TAG_DIMENSION_KEYS) {
    const dim = normalized.dimensions[key];
    if (dim?.tags?.length) {
      params.set(
        DIMENSION_QUERY_KEYS[key],
        `${dim.tags.join(",")}${MODE_SUFFIX[dim.mode] ?? ""}`
      );
    }
  }
  if (normalized.exclude.length > 0) {
    params.set("x", normalized.exclude.join(","));
  }
  if (normalized.groups.length > 0) {
    params.set("grp", encodeURIComponent(JSON.stringify(normalized.groups)));
  }
  return params.toString();
}

/**
 * @param {TagFilterSpec} a
 * @param {TagFilterSpec} b
 */
export function tagFilterSpecsEqual(a, b) {
  return (
    JSON.stringify(normalizeTagFilterSpec(a)) ===
    JSON.stringify(normalizeTagFilterSpec(b))
  );
}
