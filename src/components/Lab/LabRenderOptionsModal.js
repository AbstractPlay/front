import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cloneDeep } from "lodash";
import Modal from "../Modal";
import { getLabSetting } from "../../lib/Lab/settings";
import DisplayOptionsPicker from "../DisplayOptionsPicker.js";
import { normalizeDisplaySetting } from "../../lib/displaySettings.js";

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
  const [displayUids, displayUidsSetter] = useState([]);
  const [displayPickerKey, displayPickerKeySetter] = useState(0);
  const [annotate, annotateSetter] = useState(true);

  useEffect(() => {
    if (!show) {
      return;
    }
    displayUidsSetter(
      normalizeDisplaySetting(
        getLabSetting(
          "display",
          "default",
          gameSettings,
          labBoardSettings,
          metaGame
        )
      )
    );
    displayPickerKeySetter((key) => key + 1);
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
    newLabBoardSettings[metaGame].display = displayUids;
    newLabBoardSettings[metaGame].annotate = annotate;
    processNewSettings(gameSettings, newLabBoardSettings);
  };

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
      {show ? (
        <DisplayOptionsPicker
          key={displayPickerKey}
          metaGame={metaGame}
          initialUids={displayUids}
          onChange={displayUidsSetter}
        />
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
