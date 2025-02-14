import React, { useEffect, useState } from "react";
import { gameinfo, GameFactory, addResource } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";
import { cloneDeep } from "lodash";

/**
 * This component parses a metaGame's variant definition and returns the form for selecting them.
 * Give it the metaGame and a function for setting the string[] of selected variants.
 */
function GameVariants({ metaGame, variantsSetter }) {
  //   const groupVariantsRef = useRef({});
  const [groupVariants, groupVariantsSetter] = useState({});
  const [nonGroupVariants, nonGroupVariantsSetter] = useState({});
  const [groupData, groupDataSetter] = useState([]);
  const [nonGroupData, nonGroupDataSetter] = useState([]);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  // This does the initial parse of the data
  useEffect(() => {
    if (metaGame !== undefined && metaGame !== null && metaGame !== "") {
      // load game info
      // need an engine if we want to translate the strings
      const info = gameinfo.get(metaGame);
      if (info !== undefined) {
        let gameEngine;
        if (info.playercounts.length > 1) {
          gameEngine = GameFactory(info.uid, 2);
        } else {
          gameEngine = GameFactory(info.uid);
        }

        // filter out `experimental` variants in production
        let rootAllVariants = gameEngine.allvariants();
        if (process.env.REACT_APP_REAL_MODE === "production") {
          rootAllVariants = rootAllVariants?.filter(
            (v) => v.experimental === undefined || v.experimental === false
          );
        }

        // get all non-group variants
        // but ignore variant UIDs that start with `#` as reserved
        let ngVariants = {};
        if (rootAllVariants)
          rootAllVariants
            .filter((v) => v.group === undefined || v.uid.startsWith("#"))
            .forEach((v) => (ngVariants[v.uid] = false));
        nonGroupVariantsSetter(ngVariants);

        // get all grouped variants, including those that start with "#"
        if (rootAllVariants && rootAllVariants !== undefined) {
          const groups = [
            ...new Set(
              rootAllVariants
                .filter((v) => v.group !== undefined)
                .map((v) => v.group)
            ),
          ];
          const selected = [];
          const localGroupData = groups
            .map((g) => {
              return {
                group: g,
                variants: rootAllVariants.filter(
                  (v) => v.group === g || v.uid === `#${g}`
                ),
              };
            })
            // now process each group and either add a `#` entry with defaults
            // or make sure the existing one is properly populated
            .map((entry) => {
              const cloned = cloneDeep(entry.variants);
              const idx = cloned.findIndex((v) => v.uid.startsWith("#"));
              // one exists
              if (idx >= 0) {
                if (cloned[idx].group === undefined) {
                  cloned[idx].group = entry.group;
                }
                if (cloned[idx].name === undefined) {
                  cloned[idx].name = `Default ${entry.group}`;
                }
              }
              // one does not
              else {
                cloned.unshift({
                  uid: `#${entry.group}`,
                  name: `Default ${entry.group}`,
                  description: undefined,
                  group: entry.group,
                });
              }

              // make sure at least one thing is marked as default
              const found = cloned.find(
                (v) => v.default !== undefined && v.default
              );
              // if there isn't one, mark the `#` variant as default
              if (found === undefined) {
                const idx = cloned.findIndex((v) => v.uid.startsWith("#"));
                if (idx >= 0) {
                  cloned[idx].default = true;
                }
              }
              // otherwise, push the manually marked variant to the selected array
              else {
                selected.push(found.uid)
              }
              return { group: entry.group, variants: cloned };
            });
          groupDataSetter(localGroupData);
          variantsSetter(selected);

          nonGroupDataSetter(
            rootAllVariants.filter(
              (v) => v.group === undefined && !v.uid.startsWith("#")
            )
          );
        } else {
          groupDataSetter([]);
          nonGroupDataSetter([]);
        }
      } else {
        groupDataSetter([]);
        nonGroupDataSetter([]);
      }
    } else {
      groupDataSetter([]);
      nonGroupDataSetter([]);
    }
  }, [metaGame]);

  const handleGroupChange = (group, variant) => {
    // // Ref gets updated, so no rerender. The radio buttons aren't "controlled"
    // groupVariantsRef.current[group] = variant;
    const cloned = cloneDeep(groupVariants);
    cloned[group] = variant;
    groupVariantsSetter(cloned);
  };

  const handleNonGroupChange = (event) => {
    // State get updated, so rerender. The checkboxes are controlled.
    let ngVariants = cloneDeep(nonGroupVariants);
    ngVariants[event.target.id] = !ngVariants[event.target.id];
    nonGroupVariantsSetter(ngVariants);
  };

  // update the string[] of variants whenever selections change
  useEffect(() => {
    let variants = [];
    for (var group of Object.keys(groupVariants)) {
      if (groupVariants[group] !== null && groupVariants[group] !== "") {
        variants.push(groupVariants[group]);
      }
    }
    for (var variant of Object.keys(nonGroupVariants)) {
      if (nonGroupVariants[variant]) {
        variants.push(variant);
      }
    }
    variantsSetter(variants.filter((v) => !v.startsWith("#")));
  }, [groupVariants, nonGroupVariants, variantsSetter]);

  if (groupData.length === 0 && nonGroupData.length === 0) {
    return null;
  } else {
    return (
      <>
        <div className="field">
          <label className="label">{t("PickVariant")}</label>
        </div>
        <div className="indentedContainer">
          {groupData.length === 0
            ? ""
            : groupData.map((g) => (
                <div
                  className="field"
                  key={"group:" + g.group}
                  onChange={(e) => handleGroupChange(g.group, e.target.value)}
                >
                  <label className="label">{t("PickOneVariant")}</label>
                  {g.variants.map((v) => (
                    <div className="control" key={v.uid}>
                      <label className="radio">
                        <input
                          type="radio"
                          id={v.uid}
                          value={v.uid}
                          name={g.group}
                          defaultChecked={v.default}
                        />
                        {v.name}
                      </label>
                      {v.description === undefined ||
                      v.description.length === 0 ? (
                        ""
                      ) : (
                        <p
                          className="help"
                          style={{
                            marginTop: "-0.5%",
                          }}
                        >
                          {v.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
          {nonGroupData.length === 0 ? (
            ""
          ) : (
            <>
              <div className="field">
                <label className="label">{t("PickAnyVariant")}</label>
              </div>
              <div className="field">
                {nonGroupData.map((v) => (
                  <div className="control" key={v.uid}>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        id={v.uid}
                        checked={nonGroupVariants[v.uid]}
                        onChange={handleNonGroupChange}
                      />
                      {v.name}
                    </label>
                    {v.description === undefined ||
                    v.description.length === 0 ? (
                      ""
                    ) : (
                      <p
                        className="help"
                        style={{
                          marginTop: "-0.5%",
                        }}
                      >
                        {v.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </>
    );
  }
}

export default GameVariants;
