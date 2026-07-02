import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cloneDeep } from "lodash";
import Modal from "../Modal";
import {
  getLabSetting,
  getAltDisplaysForMetaGame,
} from "../../lib/Lab/settings";

function LabRenderOptionsModal({
  show,
  game,
  labBoardSettings,
  gameSettings,
  processNewSettings,
  showSettingsSetter,
  handleClose,
}) {
  const metaGame = game?.metaGame;
  const gameId = game?.id;
  const { t } = useTranslation();
  const [display, displaySetter] = useState(null);
  const [annotate, annotateSetter] = useState(true);

  useEffect(() => {
    displaySetter(
      getLabSetting(
        "display",
        "default",
        gameSettings,
        labBoardSettings,
        metaGame
      )
    );
    annotateSetter(
      getLabSetting("annotate", true, gameSettings, labBoardSettings, metaGame)
    );
  }, [show, gameSettings, labBoardSettings, metaGame]);

  const handleSave = () => {
    showSettingsSetter(false);
    const newLabBoardSettings = cloneDeep(labBoardSettings) ?? { all: {} };
    if (!newLabBoardSettings[metaGame]) {
      newLabBoardSettings[metaGame] = {};
    }
    newLabBoardSettings[metaGame].display = display;
    newLabBoardSettings[metaGame].annotate = annotate;
    processNewSettings(gameSettings, newLabBoardSettings);
  };

  let displays;
  if (show === true && gameId !== undefined) {
    displays = getAltDisplaysForMetaGame(metaGame);
  }

  if (!gameId) {
    return "";
  }

  return (
    <Modal
      show={show}
      title={t("ChangeRenderOptions")}
      buttons={[
        { label: t("Save"), action: handleSave },
        { label: t("Close"), action: handleClose },
      ]}
    >
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
                onChange={(e) => displaySetter(e.target.value)}
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
                  onChange={(e) => displaySetter(e.target.value)}
                />
                {disp.description}
              </label>
            </div>
          ))}
        </div>
      ) : null}
      <div className="field">
        <div className="control">
          <label className="checkbox">
            <input
              type="checkbox"
              onChange={(e) => annotateSetter(e.target.checked)}
              checked={annotate}
            />
            {t("Annotate")}
          </label>
        </div>
      </div>
    </Modal>
  );
}

export default LabRenderOptionsModal;
