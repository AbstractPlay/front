import React, { useEffect, useState } from "react";
import { gameinfo, GameFactory, addResource } from "@abstractplay/gameslib";
import { useTranslation } from "react-i18next";

/**
 * This component parses a metaGame's displays definition and displays them.
 * Selection is done in RenderOptionsModal.js.
 * Give it the metaGame.
 */
function GameDisplays({ metaGame }) {
  const [displays, displaysSetter] = useState([]);
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

        // Don't need to filter out `experimental` displays unless that gets implemented.
        let displays = gameEngine.alternativeDisplays();

        // Don't need to deal with grouping.
        if (displays && displays !== undefined) {
          displaysSetter(displays);
        } else {
          displaysSetter([]);
        }
      } else {
        displaysSetter([]);
      }
    }  else {
      displaysSetter([]);
    }
  }, [metaGame]);

  if ( displays.length === 0 ) {
    return null;
  } else {
    return (
      <>
        <div className="field">
          <label className="label">
            {t("AlternativeDisplays")}
          </label>
        </div>
        <div className="indentedContainer">
          {displays.map((v) => (
           <div className="control" key={v.uid}>
              <label className="radio">
                <input
                  type="radio"
                  id={v.uid}
                  value={v.uid}
                  disabled="disabled"
                />
                {v.description === undefined ||
                 v.description.length === 0 ? (
                   v.name
                 ) : (
                   v.description
                )}
              </label>
           </div>
          ))}
        </div>
      </>
    );
  }
}

export default GameDisplays;
