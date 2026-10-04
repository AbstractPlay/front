import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  evaluateAvailability,
  gameinfo,
  GameFactory,
  sanitizeVariantSelection,
  validateVariantSelection,
} from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import {
  applySanitizedVariantSelection,
  buildGroupData,
  buildVariantFormStateFromUids,
  initialGroupVariants,
  initialNonGroupVariants,
} from "../lib/variantSelectionInit";
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
function variantUidsKey(variantUids) {
  if (!variantUids?.length) {
    return "";
  }
  return variantUids.join("|");
}

function GameVariants({
  metaGame,
  variantsSetter,
  disableFields,
  onValidityChange,
  initialVariantUids,
}) {
  const [groupVariants, groupVariantsSetter] = useState({});
  const [nonGroupVariants, nonGroupVariantsSetter] = useState({});
  const [groupData, groupDataSetter] = useState([]);
  const [nonGroupData, nonGroupDataSetter] = useState([]);
  const [allVariants, allVariantsSetter] = useState([]);
  const { t } = useTranslation();
  const initialVariantUidsPresetKey = useMemo(
    () => variantUidsKey(initialVariantUids),
    [initialVariantUids],
  );

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
    const presetUids =
      initialVariantUids?.length > 0 ? initialVariantUids : [];
    if (presetUids.length > 0) {
      const { groupVariants, nonGroupVariants } = buildVariantFormStateFromUids(
        rootAllVariants,
        presetUids,
      );
      groupVariantsSetter(groupVariants);
      nonGroupVariantsSetter(nonGroupVariants);
    } else {
      groupVariantsSetter(initialGroupVariants(builtGroupData));
      nonGroupVariantsSetter(initialNonGroupVariants(builtNonGroupData));
    }
  }, [metaGame, initialVariantUids, initialVariantUidsPresetKey]);

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
