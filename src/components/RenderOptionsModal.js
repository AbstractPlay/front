import React, { useState, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { callAuthApi } from "../lib/api";
import { cloneDeep } from "lodash";
import Modal from "./Modal";
import { gameinfo, GameFactory } from "@abstractplay/gameslib";
import { useStore } from "../stores";

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
  const [display, displaySetter] = useState(null);
  const [color, colorSetter] = useState(null);
  const [colorLevel, colorLevelSetter] = useState(null);
  const [annotate, annotateSetter] = useState(null);
  const [annotateLevel, annotateLevelSetter] = useState(null);
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const [paletteName, paletteNameSetter] = useState(null);

  useEffect(() => {
    if (
      globalMe !== null &&
      globalMe.palettes !== null &&
      globalMe.palettes.length !== 0 &&
      (paletteName === null ||
        !globalMe.palettes.map((p) => p.name).includes(paletteName))
    ) {
      paletteNameSetter(globalMe.palettes[0].name);
    }
  }, [globalMe, paletteName]);

  useEffect(() => {
    const displaySetting = getSettingAndLevel(
      "display",
      "default",
      gameSettings,
      settings,
      metaGame
    );
    displaySetter(displaySetting[0]);
    const colorSetting = getSettingAndLevel(
      "color",
      "standard",
      gameSettings,
      settings,
      metaGame
    );
    colorSetter(colorSetting[0]);
    colorLevelSetter(colorSetting[1]);
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

  const handleDisplayChange = (display, checked) => {
    console.log("handleDisplayChange", display, checked);
    if (checked) {
      displaySetter(display);
    } else {
      displaySetter(null);
    }
  };

  const handleColorChange = (color, checked) => {
    if (checked) {
      colorSetter(color);
    } else {
      colorSetter(null);
    }
  };

  const handleColorLevelChange = (level, checked) => {
    if (checked) {
      colorLevelSetter(level);
    } else {
      colorLevelSetter(null);
    }
  };

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
      display,
      newGameSettings,
      newUserSettings,
      metaGame
    );
    [newUserSettings, newGameSettings] = updateSettings(
      "color",
      colorLevel,
      color !== "standard" && color !== "blind"
        ? paletteName || "standard"
        : color,
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

  let displays;
  if (show === true && gameId !== undefined) {
    const info = gameinfo.get(metaGame);
    let gameEngine;
    if (info.playercounts.length > 1) {
      gameEngine = GameFactory(info.uid, 2);
    } else {
      gameEngine = GameFactory(info.uid);
    }
    displays = gameEngine.alternativeDisplays();
  }
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
        {displays && displays.length > 0 ? (
          <div className="field">
            <label className="label">{t("ChooseDisplay")}</label>
            <div className="control">
              <label className="radio">
                <input
                  type="radio"
                  name="display"
                  value="default"
                  checked={display === "default"}
                  onChange={(e) =>
                    handleDisplayChange(e.target.value, e.target.checked)
                  }
                />
                {t("DefaultDisplay")}
              </label>
            </div>
            {displays.map((disp) => (
              <div className="control" key={disp.uid}>
                <label className="radio">
                  <input
                    type="radio"
                    name="display"
                    value={disp.uid}
                    checked={display === disp.uid}
                    onChange={(e) =>
                      handleDisplayChange(e.target.value, e.target.checked)
                    }
                  />
                  {disp.description}
                </label>
              </div>
            ))}
          </div>
        ) : (
          ""
        )}
        <div className="field">
          <label className="label">{t("ChooseColors")}</label>
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="playerfill"
                value="standard"
                checked={color === "standard"}
                onChange={(e) =>
                  handleColorChange(e.target.value, e.target.checked)
                }
              />
              {t("StandardColors")}
            </label>
          </div>
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="playerfill"
                value="blind"
                checked={color === "blind"}
                onChange={(e) =>
                  handleColorChange(e.target.value, e.target.checked)
                }
              />
              {t("ColorBlind")}
            </label>
          </div>
          {globalMe === null ||
          globalMe.palettes === null ||
          globalMe.palettes.length === 0 ? null : (
            <>
              <div className="control">
                <label className="radio">
                  <input
                    type="radio"
                    name="playerfill"
                    value="custom"
                    checked={color !== "standard" && color !== "blind"}
                    onChange={(e) =>
                      handleColorChange(e.target.value, e.target.checked)
                    }
                  />
                  {t("Custom")}
                </label>
              </div>
              <div className="control">
                <div className="select">
                  <select
                    defaultValue={paletteName}
                    onChange={(e) => paletteNameSetter(e.target.value)}
                  >
                    {globalMe.palettes.map(({ name }) => (
                      <option value={name} key={`paletteNames|${name}`}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="field indentedContainer">
          <label className="label">{t("Level")}</label>
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="playerfilllevel"
                value="all"
                checked={colorLevel === "all"}
                onChange={(e) =>
                  handleColorLevelChange(e.target.value, e.target.checked)
                }
              />
              {t("LevelAll")}
            </label>
          </div>
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="playerfilllevel"
                value="meta"
                checked={colorLevel === "meta"}
                onChange={(e) =>
                  handleColorLevelChange(e.target.value, e.target.checked)
                }
              />
              {t("LevelMetaGame", { game: metaName })}
            </label>
          </div>
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="playerfilllevel"
                value="game"
                checked={colorLevel === "game"}
                onChange={(e) =>
                  handleColorLevelChange(e.target.value, e.target.checked)
                }
              />
              {t("LevelGame")}
            </label>
          </div>
        </div>
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
