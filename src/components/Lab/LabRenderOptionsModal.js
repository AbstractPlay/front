import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cloneDeep } from "lodash";
import Modal from "../Modal";
import { getLabSetting } from "../../lib/Lab/settings";
import DisplayOptionsPicker from "../DisplayOptionsPicker.js";
import InputModeOptionsPicker from "../InputModeOptionsPicker.js";
import { normalizeDisplaySetting } from "../../lib/displaySettings.js";
import { gameinfo } from "@abstractplay/gameslib";
import { resolveInputMode } from "../../lib/inputModeSettings.js";

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
  const [inputModeUid, inputModeUidSetter] = useState(undefined);
  const [inputPickerKey, inputPickerKeySetter] = useState(0);
  const hasInputModes = gameinfo.get(metaGame)?.inputModes?.length > 0;

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
    inputModeUidSetter(
      resolveInputMode(gameSettings, labBoardSettings, metaGame),
    );
    inputPickerKeySetter((key) => key + 1);
  }, [show, gameSettings, labBoardSettings, metaGame]);

  const handleSave = () => {
    showSettingsSetter(false);
    const newLabBoardSettings = cloneDeep(labBoardSettings) ?? { all: {} };
    if (!newLabBoardSettings[metaGame]) {
      newLabBoardSettings[metaGame] = {};
    }
    newLabBoardSettings[metaGame].display = displayUids;
    newLabBoardSettings[metaGame].annotate = annotate;
    if (hasInputModes && inputModeUid !== undefined) {
      newLabBoardSettings[metaGame].inputMode = inputModeUid;
    }
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
      {hasInputModes && show ? (
        <InputModeOptionsPicker
          key={inputPickerKey}
          metaGame={metaGame}
          initialUid={inputModeUid}
          onChange={inputModeUidSetter}
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
