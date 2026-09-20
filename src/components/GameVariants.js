import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  evaluateAvailability,
  gameinfo,
  GameFactory,
  sanitizeVariantSelection,
  validateVariantSelection,
} from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { cloneDeep } from "lodash";
import { initialNonGroupVariants } from "../lib/variantSelectionInit";
import VariantMetaChips, {
  variantShowsMetaChips,
} from "./VariantMetaChips";

// Variant constraints: /gameslib/variants/

function variantOptionHelpClassName(isOptionDisabled, variant) {
  const parts = ["help"];
  if (variantShowsMetaChips(variant)) {
    parts.push("ap-variant-option-help--with-chips");
  }
  if (isOptionDisabled) {
    parts.push("has-text-grey");
  }
  return parts.join(" ");
}

function variantOptionHelpStyle(isOptionDisabled, variant) {
  const style = {};
  if (!variantShowsMetaChips(variant)) {
    style.marginTop = "-0.5%";
  }
  if (isOptionDisabled) {
    style.opacity = 0.55;
  }
  return Object.keys(style).length > 0 ? style : undefined;
}

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

function variantUidsEqual(left, right) {
  return (
    left.length === right.length && left.every((uid, index) => uid === right[index])
  );
}

function applySanitizedVariantSelection(
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

function buildGroupData(rootAllVariants) {
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

function initialGroupVariants(groupData) {
  const initial = {};
  for (const entry of groupData) {
    const explicitDefault = entry.variants.find((v) => v.default === true);
    initial[entry.group] = explicitDefault
      ? explicitDefault.uid
      : `#${entry.group}`;
  }
  return initial;
}

function variantOptionDisabled(disableFields, availability, uid) {
  if (disableFields) {
    return true;
  }
  const entry = availability.get(uid);
  return entry !== undefined && !entry.selectable;
}

/**
 * Parses a metaGame's variant definition and returns the form for selecting them.
 */
function GameVariants({
  metaGame,
  variantsSetter,
  disableFields,
  onValidityChange,
}) {
  const [groupVariants, groupVariantsSetter] = useState({});
  const [nonGroupVariants, nonGroupVariantsSetter] = useState({});
  const [groupData, groupDataSetter] = useState([]);
  const [nonGroupData, nonGroupDataSetter] = useState([]);
  const [allVariants, allVariantsSetter] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (metaGame === undefined || metaGame === null || metaGame === "") {
      groupDataSetter([]);
      nonGroupDataSetter([]);
      allVariantsSetter([]);
      groupVariantsSetter({});
      nonGroupVariantsSetter({});
      return;
    }

    const info = gameinfo.get(metaGame);
    if (info === undefined) {
      groupDataSetter([]);
      nonGroupDataSetter([]);
      allVariantsSetter([]);
      groupVariantsSetter({});
      nonGroupVariantsSetter({});
      return;
    }

    const gameEngine =
      info.playercounts.length > 1
        ? GameFactory(info.uid, 2)
        : GameFactory(info.uid);

    const rootAllVariants =
      typeof gameEngine.challengeVariants === "function"
        ? gameEngine.challengeVariants()
        : gameEngine.allvariants();

    if (!rootAllVariants) {
      groupDataSetter([]);
      nonGroupDataSetter([]);
      allVariantsSetter([]);
      groupVariantsSetter({});
      nonGroupVariantsSetter({});
      return;
    }

    allVariantsSetter(rootAllVariants);

    const builtGroupData = buildGroupData(rootAllVariants);
    const builtNonGroupData = rootAllVariants.filter(
      (v) => v.group === undefined && !v.uid.startsWith("#"),
    );

    groupDataSetter(builtGroupData);
    nonGroupDataSetter(builtNonGroupData);
    groupVariantsSetter(initialGroupVariants(builtGroupData));
    nonGroupVariantsSetter(initialNonGroupVariants(builtNonGroupData));
  }, [metaGame]);

  const handleGroupChange = useCallback((group, variant) => {
    groupVariantsSetter((current) => ({
      ...current,
      [group]: variant,
    }));
  }, []);

  const handleNonGroupChange = useCallback((uid, checked) => {
    nonGroupVariantsSetter((current) => ({
      ...current,
      [uid]: checked,
    }));
  }, []);

  const activeVariantUids = useMemo(
    () => collectActiveVariantUids(groupVariants, nonGroupVariants),
    [groupVariants, nonGroupVariants],
  );

  const availability = useMemo(() => {
    if (disableFields || allVariants.length === 0) {
      return new Map();
    }
    return evaluateAvailability(allVariants, activeVariantUids);
  }, [allVariants, activeVariantUids, disableFields]);

  useEffect(() => {
    if (allVariants.length === 0) {
      variantsSetter([]);
      onValidityChange?.(true, []);
      return;
    }

    let active = activeVariantUids;
    if (!disableFields) {
      const sanitized = sanitizeVariantSelection(allVariants, active);
      if (!variantUidsEqual(active, sanitized)) {
        const next = applySanitizedVariantSelection(
          sanitized,
          groupVariants,
          nonGroupVariants,
          allVariants,
        );
        groupVariantsSetter(next.groupVariants);
        nonGroupVariantsSetter(next.nonGroupVariants);
        return;
      }
      active = sanitized;
    }

    variantsSetter(active.filter((uid) => !uid.startsWith("#")));

    if (onValidityChange) {
      const validation = validateVariantSelection(allVariants, active);
      onValidityChange(
        validation.ok,
        validation.ok ? [] : validation.errors,
      );
    }
  }, [
    activeVariantUids,
    allVariants,
    disableFields,
    groupVariants,
    nonGroupVariants,
    onValidityChange,
    variantsSetter,
  ]);

  if (groupData.length === 0 && nonGroupData.length === 0) {
    return null;
  }

  return (
    <>
      <div className="field">
        <label className="label">
          {t("PickVariant", {
            context: disableFields ? "disabled" : "normal",
          })}
        </label>
      </div>
      <div className="indentedContainer">
        {groupData.length === 0
          ? ""
          : groupData.map((g) => (
              <div className="field" key={"group:" + g.group}>
                <label className="label">
                  {t("PickOneVariant", {
                    context: disableFields ? "disabled" : "normal",
                  })}
                </label>
                {g.variants.map((v) => {
                  const isOptionDisabled = variantOptionDisabled(
                    disableFields,
                    availability,
                    v.uid,
                  );
                  return (
                    <div className="control" key={v.uid}>
                      <label
                        className={
                          isOptionDisabled ? "radio has-text-grey" : "radio"
                        }
                        style={
                          isOptionDisabled
                            ? { opacity: 0.55, cursor: "not-allowed" }
                            : undefined
                        }
                      >
                        <input
                          type="radio"
                          id={v.uid}
                          value={v.uid}
                          name={g.group}
                          checked={groupVariants[g.group] === v.uid}
                          onChange={() => handleGroupChange(g.group, v.uid)}
                          disabled={isOptionDisabled}
                        />
                        {v.name}
                        <VariantMetaChips variant={v} compact />
                      </label>
                      {v.description === undefined ||
                      v.description.length === 0 ? (
                        ""
                      ) : (
                        <p
                          className={variantOptionHelpClassName(
                            isOptionDisabled,
                            v,
                          )}
                          style={variantOptionHelpStyle(isOptionDisabled, v)}
                        >
                          {v.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
        {nonGroupData.length === 0 ? (
          ""
        ) : (
          <>
            <div className="field">
              <label className="label">
                {t("PickAnyVariant", {
                  context: disableFields ? "disabled" : "normal",
                })}
              </label>
            </div>
            <div className="field">
              {nonGroupData.map((v) => {
                const isOptionDisabled = variantOptionDisabled(
                  disableFields,
                  availability,
                  v.uid,
                );
                return (
                  <div className="control" key={v.uid}>
                    <label
                      className={
                        isOptionDisabled ? "checkbox has-text-grey" : "checkbox"
                      }
                      style={
                        isOptionDisabled
                          ? { opacity: 0.55, cursor: "not-allowed" }
                          : undefined
                      }
                    >
                      <input
                        type="checkbox"
                        id={v.uid}
                        checked={Boolean(nonGroupVariants[v.uid])}
                        onChange={(event) =>
                          handleNonGroupChange(v.uid, event.target.checked)
                        }
                        disabled={isOptionDisabled}
                      />
                      {v.name}
                      <VariantMetaChips variant={v} compact />
                    </label>
                    {v.description === undefined ||
                    v.description.length === 0 ? (
                      ""
                    ) : (
                      <p
                        className={variantOptionHelpClassName(
                          isOptionDisabled,
                          v,
                        )}
                        style={variantOptionHelpStyle(isOptionDisabled, v)}
                      >
                        {v.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default GameVariants;
