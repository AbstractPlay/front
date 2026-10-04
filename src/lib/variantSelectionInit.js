import { cloneDeep } from "lodash";
import { sanitizeVariantSelection } from "@abstractplay/gameslib";

export function initialNonGroupVariants(nonGroupData) {
  const initial = {};
  for (const v of nonGroupData) {
    initial[v.uid] = v.default === true;
  }
  return initial;
}

export function buildGroupData(rootAllVariants) {
  const groups = [
    ...new Set(
      rootAllVariants
        .filter((v) => v.group !== undefined)
        .map((v) => v.group),
    ),
  ];
  return groups.map((group) => {
    const variants = rootAllVariants.filter(
      (v) => v.group === group || v.uid === `#${group}`,
    );
    const cloned = cloneDeep(variants);
    const sentinelIdx = cloned.findIndex((v) => v.uid.startsWith("#"));
    if (sentinelIdx >= 0) {
      if (cloned[sentinelIdx].group === undefined) {
        cloned[sentinelIdx].group = group;
      }
      if (cloned[sentinelIdx].name === undefined) {
        cloned[sentinelIdx].name = `Default ${group}`;
      }
    } else {
      cloned.unshift({
        uid: `#${group}`,
        name: `Default ${group}`,
        description: undefined,
        group,
      });
    }
    const explicitDefault = cloned.find((v) => v.default === true);
    if (explicitDefault === undefined) {
      const idx = cloned.findIndex((v) => v.uid.startsWith("#"));
      if (idx >= 0) {
        cloned[idx].default = true;
      }
    }
    return { group, variants: cloned };
  });
}

export function initialGroupVariants(groupData) {
  const initial = {};
  for (const entry of groupData) {
    const explicitDefault = entry.variants.find((v) => v.default === true);
    initial[entry.group] = explicitDefault
      ? explicitDefault.uid
      : `#${entry.group}`;
  }
  return initial;
}

/**
 * @param {readonly string[]} sanitized
 * @param {Record<string, string>} groupVariants
 * @param {Record<string, boolean>} nonGroupVariants
 * @param {readonly { uid: string, group?: string }[]} allVariants
 */
export function applySanitizedVariantSelection(
  sanitized,
  groupVariants,
  nonGroupVariants,
  allVariants,
) {
  const nextGroup = { ...groupVariants };
  const nextNonGroup = { ...nonGroupVariants };
  const groups = [
    ...new Set(
      allVariants.filter((v) => v.group !== undefined).map((v) => v.group),
    ),
  ];
  for (const group of groups) {
    const member = sanitized.find((uid) => {
      const def = allVariants.find((v) => v.uid === uid);
      return def?.group === group;
    });
    nextGroup[group] = member ?? `#${group}`;
  }
  for (const uid of Object.keys(nextNonGroup)) {
    nextNonGroup[uid] = sanitized.includes(uid);
  }
  return { groupVariants: nextGroup, nonGroupVariants: nextNonGroup };
}

/**
 * Initial group/checkbox state for GameVariants from explicit variant UIDs.
 * When `variantUids` is empty, returns default selections only.
 *
 * @param {readonly { uid: string, group?: string, default?: boolean }[]} allVariants
 * @param {readonly string[]} variantUids
 */
export function buildVariantFormStateFromUids(allVariants, variantUids) {
  const builtGroupData = buildGroupData(allVariants);
  const builtNonGroupData = allVariants.filter(
    (v) => v.group === undefined && !v.uid.startsWith("#"),
  );
  let groupVariants = initialGroupVariants(builtGroupData);
  let nonGroupVariants = initialNonGroupVariants(builtNonGroupData);
  if (variantUids.length > 0) {
    const sanitized = sanitizeVariantSelection(allVariants, [...variantUids]);
    const next = applySanitizedVariantSelection(
      sanitized,
      groupVariants,
      nonGroupVariants,
      allVariants,
    );
    groupVariants = next.groupVariants;
    nonGroupVariants = next.nonGroupVariants;
  }
  return { groupVariants, nonGroupVariants };
}
