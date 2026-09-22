import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  evaluateDisplayAvailability,
  gameinfo,
  GameFactory,
  sanitizeDisplaySelection,
} from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { cloneDeep } from "lodash";
import {
  displaySettingEqual,
  normalizeDisplaySetting,
} from "../lib/displaySettings.js";
import { initialNonGroupVariants } from "../lib/variantSelectionInit";

/** Composite shortcuts expanded by sanitize; not shown as picker toggles. */
const PICKER_HIDDEN_UIDS = new Set(["hide-both"]);

function selectionKey(uids) {
  return normalizeDisplaySetting(uids).slice().sort().join("\0");
}

function collectActiveDisplayUids(groupVariants, nonGroupVariants) {
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

function displayUidsEqual(left, right) {
  return displaySettingEqual(left, right);
}

function applySanitizedDisplaySelection(
  sanitized,
  groupVariants,
  nonGroupVariants,
  allDisplays,
) {
  const nextGroup = { ...groupVariants };
  const nextNonGroup = { ...nonGroupVariants };
  const groups = [
    ...new Set(
      allDisplays.filter((d) => d.group !== undefined).map((d) => d.group),
    ),
  ];
  for (const group of groups) {
    const member = sanitized.find((uid) => {
      const def = allDisplays.find((d) => d.uid === uid);
      return def?.group === group;
    });
    nextGroup[group] = member ?? `#${group}`;
  }
  for (const uid of Object.keys(nextNonGroup)) {
    nextNonGroup[uid] = sanitized.includes(uid);
  }
  return { groupVariants: nextGroup, nonGroupVariants: nextNonGroup };
}

function buildGroupData(rootAllDisplays) {
  const groups = [
    ...new Set(
      rootAllDisplays
        .filter((d) => d.group !== undefined)
        .map((d) => d.group),
    ),
  ];
  return groups.map((group) => {
    const variants = rootAllDisplays.filter(
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
    return { group, variants: cloned };
  });
}

function initialGroupVariants(groupData) {
  const initial = {};
  for (const entry of groupData) {
    initial[entry.group] = `#${entry.group}`;
  }
  return initial;
}

function displayOptionDisabled(disableFields, availability, uid) {
  if (disableFields) {
    return true;
  }
  const entry = availability.get(uid);
  return entry !== undefined && !entry.selectable;
}

function displayOptionHelpClassName(isOptionDisabled) {
  return isOptionDisabled ? "help has-text-grey" : "help";
}

function displayOptionHelpStyle(isOptionDisabled) {
  return isOptionDisabled ? { opacity: 0.55 } : undefined;
}

/**
 * Variant-like picker for combinable alternative displays.
 * Remount with a new `key` when the modal opens so `initialUids` is read once.
 * @param {{ metaGame: string, initialUids?: string[], onChange?: (uids: string[]) => void, disableFields?: boolean }} props
 */
function DisplayOptionsPicker({
  metaGame,
  initialUids,
  onChange,
  disableFields = false,
}) {
  const [groupVariants, groupVariantsSetter] = useState({});
  const [nonGroupVariants, nonGroupVariantsSetter] = useState({});
  const [groupData, groupDataSetter] = useState([]);
  const [nonGroupData, nonGroupDataSetter] = useState([]);
  const [allDisplays, allDisplaysSetter] = useState([]);
  const initialUidsRef = useRef(normalizeDisplaySetting(initialUids));
  const lastEmittedKeyRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (metaGame === undefined || metaGame === null || metaGame === "") {
      groupDataSetter([]);
      nonGroupDataSetter([]);
      allDisplaysSetter([]);
      groupVariantsSetter({});
      nonGroupVariantsSetter({});
      lastEmittedKeyRef.current = null;
      return;
    }

    const info = gameinfo.get(metaGame);
    if (info === undefined) {
      groupDataSetter([]);
      nonGroupDataSetter([]);
      allDisplaysSetter([]);
      groupVariantsSetter({});
      nonGroupVariantsSetter({});
      lastEmittedKeyRef.current = null;
      return;
    }

    const gameEngine =
      info.playercounts.length > 1
        ? GameFactory(info.uid, 2)
        : GameFactory(info.uid);

    const rootAllDisplays = gameEngine.alternativeDisplays();
    if (!rootAllDisplays?.length) {
      groupDataSetter([]);
      nonGroupDataSetter([]);
      allDisplaysSetter([]);
      groupVariantsSetter({});
      nonGroupVariantsSetter({});
      lastEmittedKeyRef.current = selectionKey([]);
      return;
    }

    allDisplaysSetter(rootAllDisplays);

    const builtGroupData = buildGroupData(rootAllDisplays);
    const builtNonGroupData = rootAllDisplays.filter(
      (d) =>
        d.group === undefined &&
        !d.uid.startsWith("#") &&
        !PICKER_HIDDEN_UIDS.has(d.uid),
    );

    groupDataSetter(builtGroupData);
    nonGroupDataSetter(builtNonGroupData);

    const defs = info.displays ?? [];
    const sanitized = sanitizeDisplaySelection(
      defs,
      initialUidsRef.current,
    );
    const applied = applySanitizedDisplaySelection(
      sanitized,
      initialGroupVariants(builtGroupData),
      initialNonGroupVariants(builtNonGroupData),
      rootAllDisplays,
    );
    groupVariantsSetter(applied.groupVariants);
    nonGroupVariantsSetter(applied.nonGroupVariants);
    lastEmittedKeyRef.current = selectionKey(
      sanitized.filter((uid) => !uid.startsWith("#")),
    );
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

  const activeDisplayUids = useMemo(
    () => collectActiveDisplayUids(groupVariants, nonGroupVariants),
    [groupVariants, nonGroupVariants],
  );

  const availability = useMemo(() => {
    if (disableFields || allDisplays.length === 0) {
      return new Map();
    }
    return evaluateDisplayAvailability(allDisplays, activeDisplayUids);
  }, [activeDisplayUids, allDisplays, disableFields]);

  useEffect(() => {
    if (allDisplays.length === 0) {
      if (lastEmittedKeyRef.current !== selectionKey([])) {
        lastEmittedKeyRef.current = selectionKey([]);
        onChange?.([]);
      }
      return;
    }

    const defs = gameinfo.get(metaGame)?.displays ?? [];
    let active = activeDisplayUids;
    if (!disableFields) {
      const sanitized = sanitizeDisplaySelection(defs, active);
      if (!displayUidsEqual(active, sanitized)) {
        const next = applySanitizedDisplaySelection(
          sanitized,
          groupVariants,
          nonGroupVariants,
          allDisplays,
        );
        groupVariantsSetter(next.groupVariants);
        nonGroupVariantsSetter(next.nonGroupVariants);
        return;
      }
      active = sanitized;
    }

    const outgoing = active.filter((uid) => !uid.startsWith("#"));
    const key = selectionKey(outgoing);
    if (key === lastEmittedKeyRef.current) {
      return;
    }
    lastEmittedKeyRef.current = key;
    onChange?.(outgoing);
  }, [
    activeDisplayUids,
    allDisplays,
    disableFields,
    groupVariants,
    metaGame,
    nonGroupVariants,
    onChange,
  ]);

  if (groupData.length === 0 && nonGroupData.length === 0) {
    return null;
  }

  return (
    <>
      <div className="field">
        <label className="label">{t("ChooseDisplay")}</label>
      </div>
      <div className="indentedContainer">
        {groupData.map((g) => (
          <div className="field" key={"group:" + g.group}>
            <label className="label">
              {t("PickOneVariant", {
                context: disableFields ? "disabled" : "normal",
              })}
            </label>
            {g.variants.map((d) => {
              const isOptionDisabled = displayOptionDisabled(
                disableFields,
                availability,
                d.uid,
              );
              return (
                <div className="control" key={d.uid}>
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
                      id={`display-${d.uid}`}
                      value={d.uid}
                      name={`display-${g.group}`}
                      checked={groupVariants[g.group] === d.uid}
                      onChange={() => handleGroupChange(g.group, d.uid)}
                      disabled={isOptionDisabled}
                    />
                    {d.name ?? d.description}
                  </label>
                  {d.description === undefined ||
                  d.description.length === 0 ||
                  d.name === undefined ? (
                    ""
                  ) : (
                    <p
                      className={displayOptionHelpClassName(isOptionDisabled)}
                      style={displayOptionHelpStyle(isOptionDisabled)}
                    >
                      {d.description}
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
              {nonGroupData.map((d) => {
                const isOptionDisabled = displayOptionDisabled(
                  disableFields,
                  availability,
                  d.uid,
                );
                return (
                  <div className="control" key={d.uid}>
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
                        id={`display-${d.uid}`}
                        checked={Boolean(nonGroupVariants[d.uid])}
                        onChange={(event) =>
                          handleNonGroupChange(d.uid, event.target.checked)
                        }
                        disabled={isOptionDisabled}
                      />
                      {d.name ?? d.description}
                    </label>
                    {d.description === undefined ||
                    d.description.length === 0 ||
                    d.name === undefined ? (
                      ""
                    ) : (
                      <p
                        className={displayOptionHelpClassName(isOptionDisabled)}
                        style={displayOptionHelpStyle(isOptionDisabled)}
                      >
                        {d.description}
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

export default DisplayOptionsPicker;
