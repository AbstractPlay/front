import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  evaluateInputModeAvailability,
  gameinfo,
  GameFactory,
  sanitizeInputModeSelection,
} from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { cloneDeep } from "lodash";

/** @param {import("@abstractplay/gameslib").InputMode[]} rootAllModes */
function buildGroupData(rootAllModes) {
  const groups = [
    ...new Set(
      rootAllModes.filter((d) => d.group !== undefined).map((d) => d.group),
    ),
  ];
  return groups.map((group) => {
    const variants = rootAllModes.filter(
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

function collectActiveInputModeUids(groupVariants) {
  const uids = [];
  Object.values(groupVariants).forEach((uid) => {
    if (uid && !uid.startsWith("#")) {
      uids.push(uid);
    }
  });
  return uids;
}

function applySanitizedInputModeSelection(sanitized, groupVariants, allModes) {
  const nextGroup = { ...groupVariants };
  const groups = [
    ...new Set(allModes.filter((d) => d.group !== undefined).map((d) => d.group)),
  ];
  for (const group of groups) {
    const member = sanitized.find((uid) => {
      const def = allModes.find((d) => d.uid === uid);
      return def?.group === group;
    });
    nextGroup[group] = member ?? `#${group}`;
  }
  return nextGroup;
}

function inputModeOptionDisabled(disableFields, availability, uid) {
  if (disableFields) {
    return true;
  }
  const entry = availability.get(uid);
  return entry !== undefined && !entry.selectable;
}

/**
 * Radio picker for gameinfo.inputModes (mutually exclusive groups).
 * @param {{ metaGame: string, initialUid?: string, onChange?: (uid: string | undefined) => void, disableFields?: boolean }} props
 */
function InputModeOptionsPicker({
  metaGame,
  initialUid,
  onChange,
  disableFields = false,
}) {
  const [groupVariants, groupVariantsSetter] = useState({});
  const [groupData, groupDataSetter] = useState([]);
  const [allModes, allModesSetter] = useState([]);
  const initialUidRef = useRef(initialUid);
  const lastEmittedRef = useRef(null);
  const initDoneRef = useRef(false);
  const { t } = useTranslation();

  /** @type {[string | undefined, React.Dispatch<React.SetStateAction<string | undefined>>]} */
  const [ungroupedChoice, ungroupedChoiceSetter] = useState(undefined);

  useEffect(() => {
    initialUidRef.current = initialUid;
    initDoneRef.current = false;
    if (metaGame === undefined || metaGame === null || metaGame === "") {
      groupDataSetter([]);
      allModesSetter([]);
      groupVariantsSetter({});
      ungroupedChoiceSetter(undefined);
      lastEmittedRef.current = null;
      return;
    }
    const info = gameinfo.get(metaGame);
    if (info === undefined || !info.inputModes?.length) {
      groupDataSetter([]);
      allModesSetter([]);
      groupVariantsSetter({});
      ungroupedChoiceSetter(undefined);
      lastEmittedRef.current = null;
      return;
    }
    const gameEngine =
      info.playercounts.length > 1
        ? GameFactory(info.uid, 2)
        : GameFactory(info.uid);
    const rootAllModes = gameEngine.inputModes?.();
    if (!rootAllModes?.length) {
      groupDataSetter([]);
      allModesSetter([]);
      groupVariantsSetter({});
      ungroupedChoiceSetter(undefined);
      lastEmittedRef.current = null;
      return;
    }
    allModesSetter(rootAllModes);
    const builtGroupData = buildGroupData(rootAllModes);
    groupDataSetter(builtGroupData);
    const defs = info.inputModes ?? [];
    const incomingInit =
      initialUidRef.current !== undefined &&
      initialUidRef.current !== null &&
      String(initialUidRef.current) !== ""
        ? [String(initialUidRef.current)]
        : [];
    const sanitized = sanitizeInputModeSelection(defs, incomingInit);
    if (builtGroupData.length === 0) {
      const flat = rootAllModes.filter((m) => !m.uid.startsWith("#"));
      const pick =
        sanitized.find((u) => !u.startsWith("#")) ??
        flat[0]?.uid ??
        undefined;
      ungroupedChoiceSetter(pick);
      groupVariantsSetter({});
      lastEmittedRef.current = pick;
      initDoneRef.current = true;
    } else {
      const applied = applySanitizedInputModeSelection(
        sanitized,
        initialGroupVariants(builtGroupData),
        rootAllModes,
      );
      groupVariantsSetter(applied);
      ungroupedChoiceSetter(undefined);
      const first =
        sanitized.find((u) => !u.startsWith("#")) ?? sanitized[0] ?? undefined;
      lastEmittedRef.current = first;
      initDoneRef.current = true;
    }
  }, [metaGame, initialUid]);

  const handleGroupChange = useCallback((group, variant) => {
    groupVariantsSetter((current) => ({
      ...current,
      [group]: variant,
    }));
  }, []);

  const activeUids = useMemo(() => {
    if (groupData.length === 0 && ungroupedChoice !== undefined) {
      return [ungroupedChoice];
    }
    return collectActiveInputModeUids(groupVariants);
  }, [groupData.length, groupVariants, ungroupedChoice]);

  const availability = useMemo(() => {
    if (disableFields || allModes.length === 0) {
      return new Map();
    }
    return evaluateInputModeAvailability(allModes, activeUids);
  }, [activeUids, allModes, disableFields]);

  useEffect(() => {
    if (!initDoneRef.current) {
      return;
    }
    if (allModes.length === 0) {
      if (lastEmittedRef.current !== undefined) {
        lastEmittedRef.current = undefined;
        onChange?.(undefined);
      }
      return;
    }
    const defs = gameinfo.get(metaGame)?.inputModes ?? [];
    let active = activeUids;
    if (!disableFields) {
      const sanitized = sanitizeInputModeSelection(defs, active);
      if (sanitized.join("\0") !== active.slice().sort().join("\0")) {
        if (groupData.length > 0) {
          const next = applySanitizedInputModeSelection(
            sanitized,
            groupVariants,
            allModes,
          );
          groupVariantsSetter(next);
        } else {
          const flat = allModes.filter((m) => !m.uid.startsWith("#"));
          const pick =
            sanitized.find((u) => !u.startsWith("#")) ?? flat[0]?.uid;
          ungroupedChoiceSetter(pick);
        }
        return;
      }
      active = sanitized;
    }
    const concrete = active.find((u) => !u.startsWith("#"));
    if (concrete === lastEmittedRef.current) {
      return;
    }
    lastEmittedRef.current = concrete;
    onChange?.(concrete);
  }, [
    activeUids,
    allModes,
    disableFields,
    groupVariants,
    groupData.length,
    metaGame,
    onChange,
  ]);

  const flatUngrouped = useMemo(
    () => allModes.filter((m) => m.group === undefined && !m.uid.startsWith("#")),
    [allModes],
  );

  if (groupData.length === 0 && flatUngrouped.length <= 1) {
    return null;
  }

  return (
    <>
      <div className="field">
        <label className="label">{t("apgames:inputModes.section")}</label>
        <p className="help">{t("apgames:inputModes.description")}</p>
      </div>
      <div className="indentedContainer">
        {groupData.length === 0 && flatUngrouped.length > 1 ? (
          <div className="field">
            <label className="label">
              {t("PickOneVariant", {
                context: disableFields ? "disabled" : "normal",
              })}
            </label>
            {flatUngrouped.map((d) => {
              const isOptionDisabled = inputModeOptionDisabled(
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
                      id={`inputMode-flat-${d.uid}`}
                      value={d.uid}
                      name="inputMode-ungrouped"
                      checked={ungroupedChoice === d.uid}
                      onChange={() => ungroupedChoiceSetter(d.uid)}
                      disabled={isOptionDisabled}
                    />
                    {d.name ?? d.uid}
                  </label>
                  {d.description &&
                  d.name !== undefined &&
                  String(d.description).length > 0 ? (
                    <p
                      className={
                        isOptionDisabled ? "help has-text-grey" : "help"
                      }
                      style={
                        isOptionDisabled ? { opacity: 0.55 } : undefined
                      }
                    >
                      {d.description}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
        {groupData.map((g) => (
          <div className="field" key={`inputMode-group:${g.group}`}>
            <label className="label">
              {t("PickOneVariant", {
                context: disableFields ? "disabled" : "normal",
              })}
            </label>
            {g.variants.map((d) => {
              const isOptionDisabled = inputModeOptionDisabled(
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
                      id={`inputMode-${d.uid}`}
                      value={d.uid}
                      name={`inputMode-${g.group}`}
                      checked={groupVariants[g.group] === d.uid}
                      onChange={() => handleGroupChange(g.group, d.uid)}
                      disabled={isOptionDisabled}
                    />
                    {d.name ?? d.uid}
                  </label>
                  {d.description === undefined ||
                  d.description.length === 0 ||
                  d.name === undefined ? (
                    ""
                  ) : (
                    <p
                      className={
                        isOptionDisabled ? "help has-text-grey" : "help"
                      }
                      style={
                        isOptionDisabled ? { opacity: 0.55 } : undefined
                      }
                    >
                      {d.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

export default InputModeOptionsPicker;
