import React, { useState, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { callAuthApi } from "../lib/api";
import { cloneDeep } from "lodash";
import Modal from "./Modal";
import { useStore } from "../stores";
import DisplayOptionsPicker from "./DisplayOptionsPicker.js";
import { normalizeDisplaySetting } from "../lib/displaySettings.js";

function getSettingAndLevel(
  setting,
  deflt,
  gameSettings,
  userSettings,
  metaGame
) {
  if (gameSettings !== undefined && gameSettings[setting] !== undefined) {
    return [gameSettings[setting], "game"];
  } else if (userSettings !== undefined) {
    if (
      userSettings[metaGame] !== undefined &&
      userSettings[metaGame][setting] !== undefined
    ) {
      return [userSettings[metaGame][setting], "meta"];
    } else if (
      userSettings.all !== undefined &&
      userSettings.all[setting] !== undefined
    ) {
      return [userSettings.all[setting], "all"];
    } else {
      return [deflt, "game"];
    }
  } else {
    return [deflt, "game"];
  }
}

function updateSettings(
  setting,
  level,
  val,
  gameSettings,
  userSettings,
  metaGame
) {
  if (level === "game") {
    if (gameSettings === undefined) gameSettings = {};
    gameSettings[setting] = val;
  } else if (level === "meta") {
    if (userSettings === undefined) userSettings = {};
    if (userSettings[metaGame] === undefined) userSettings[metaGame] = {};
    userSettings[metaGame][setting] = val;
    if (gameSettings !== undefined && gameSettings[setting] !== undefined)
      delete gameSettings[setting];
  } else {
    if (userSettings === undefined) userSettings = {};
    if (userSettings.all === undefined) userSettings.all = {};
    userSettings.all[setting] = val;
    if (
      userSettings[metaGame] !== undefined &&
      userSettings[metaGame][setting] !== undefined
    )
      delete userSettings[metaGame][setting];
    if (gameSettings !== undefined && gameSettings[setting] !== undefined)
      delete gameSettings[setting];
  }
  return [userSettings, gameSettings];
}

function RenderOptionsModal(props) {
  const handleClose = props.handleClose;
  const metaGame = props.game?.metaGame;
  const metaName = props.game?.name;
  const gameId = props.game?.id;
  const game = props.game;
  const cbit = game
    ? game.toMove === "" || game.toMove === null
      ? 1
      : 0
    : undefined;
  const settings = props.settings;
  const gameSettings = props.gameSettings;
  const show = props.show;
  const [displayUids, displayUidsSetter] = useState([]);
  const [displayPickerKey, displayPickerKeySetter] = useState(0);
  const [annotate, annotateSetter] = useState(null);
  const [annotateLevel, annotateLevelSetter] = useState(null);
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);

  useEffect(() => {
    if (!show) {
      return;
    }
    const displaySetting = getSettingAndLevel(
      "display",
      "default",
      gameSettings,
      settings,
      metaGame
    );
    displayUidsSetter(normalizeDisplaySetting(displaySetting[0]));
    displayPickerKeySetter((key) => key + 1);
    const annotateSetting = getSettingAndLevel(
      "annotate",
      true,
      gameSettings,
      settings,
      metaGame
    );
    annotateSetter(annotateSetting[0]);
    annotateLevelSetter(annotateSetting[1]);
  }, [show, gameSettings, metaGame, settings]);

  const handleAnnotationChange = (checked) => {
    annotateSetter(checked);
  };

  const handleAnnotationLevelChange = (level, checked) => {
    if (checked) {
      annotateLevelSetter(level);
    } else {
      annotateLevelSetter(null);
    }
  };

  const handleSave = async () => {
    props.showSettingsSetter(false);
    let newUserSettings = cloneDeep(settings);
    let newGameSettings = cloneDeep(gameSettings);
    [newUserSettings, newGameSettings] = updateSettings(
      "display",
      "meta",
      displayUids,
      newGameSettings,
      newUserSettings,
      metaGame
    );
    [newUserSettings, newGameSettings] = updateSettings(
      "annotate",
      annotateLevel,
      annotate,
      newGameSettings,
      newUserSettings,
      metaGame
    );
    props.processNewSettings(newGameSettings, newUserSettings);
    if (newGameSettings !== undefined && game.me > -1) {
      try {
        await callAuthApi("update_game_settings", {
          game: gameId,
          metaGame: metaGame,
          cbit: cbit,
          settings: newGameSettings,
        });
      } catch (error) {
        props.setError(error);
      }
    }
    if (newUserSettings !== undefined) {
      try {
        await callAuthApi("update_user_settings", {
          settings: newUserSettings,
        });
        const { setGlobalMe } = useStore.getState();
        const newMe = cloneDeep(globalMe);
        newMe.settings = cloneDeep(newUserSettings);
        setGlobalMe(newMe);
      } catch (error) {
        props.setError(error);
      }
    }
  };

  return !gameId ? (
    ""
  ) : (
    <Modal
      show={show}
      title={t("ChangeRenderOptions")}
      buttons={[
        { label: t("Save"), action: handleSave },
        { label: t("Close"), action: handleClose },
      ]}
    >
      <Fragment>
        {show ? (
          <DisplayOptionsPicker
            key={displayPickerKey}
            metaGame={metaGame}
            initialUids={displayUids}
            onChange={displayUidsSetter}
          />
        ) : (
          ""
        )}
        <div className="field">
          <div className="control">
            <label className="checkbox">
              <input
                type="checkbox"
                onChange={(e) => handleAnnotationChange(e.target.checked)}
                checked={annotate}
              />
              {t("Annotate")}
            </label>
          </div>
        </div>
        <div className="field indentedContainer">
          <label className="label">{t("AnnotationLevel")}</label>
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="annotationlevel"
                value="all"
                checked={annotateLevel === "all"}
                onChange={(e) =>
                  handleAnnotationLevelChange(e.target.value, e.target.checked)
                }
              />
              {t("LevelAll")}
            </label>
          </div>
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="annotationlevel"
                value="meta"
                checked={annotateLevel === "meta"}
                onChange={(e) =>
                  handleAnnotationLevelChange(e.target.value, e.target.checked)
                }
              />
              {t("LevelMetaGame", { game: metaName })}
            </label>
          </div>
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="annotationlevel"
                value="game"
                checked={annotateLevel === "game"}
                onChange={(e) =>
                  handleAnnotationLevelChange(e.target.value, e.target.checked)
                }
              />
              {t("LevelGame")}
            </label>
          </div>
        </div>
      </Fragment>
    </Modal>
  );
}

export default RenderOptionsModal;
