import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { useStorageState } from "react-use-storage-state";
import Modal from "../Modal";
import GameVariants from "../GameVariants";
import { soloPlaySupported } from "../../lib/soloPlay";

function SoloPlayModal({
  show,
  fixedMetaGame,
  handleClose,
  handleStart,
  initialChallengeSeed = "",
}) {
  const { t } = useTranslation();
  const [error, errorSetter] = useState("");
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [challengeSeed, setChallengeSeed] = useState(initialChallengeSeed);
  const [clockStart] = useStorageState("new-challenge-clock-start", 48);
  const [clockInc] = useStorageState("new-challenge-clock-inc", 24);
  const [clockMax] = useStorageState("new-challenge-clock-max", 96);
  const [clockHard] = useStorageState("new-challenge-clock-hard", false);
  const [noExplore] = useStorageState("new-challenge-noExplore", false);

  useEffect(() => {
    if (show) {
      setChallengeSeed(initialChallengeSeed ?? "");
      errorSetter("");
    }
  }, [show, initialChallengeSeed]);

  if (!fixedMetaGame || !gameinfo.has(fixedMetaGame) || !soloPlaySupported(fixedMetaGame)) {
    return null;
  }

  const onStart = () => {
    errorSetter("");
    const trimmedSeed = challengeSeed.trim();
    handleStart({
      metaGame: fixedMetaGame,
      variants: selectedVariants,
      challengeSeed: trimmedSeed.length > 0 ? trimmedSeed : undefined,
      clockStart,
      clockInc,
      clockMax,
      clockHard,
      noExplore,
    });
  };

  return (
    <Modal
      show={show}
      title={t("solo.playTitle")}
      buttons={[
        { label: t("solo.playAction"), action: onStart },
        { label: t("Cancel"), action: handleClose },
      ]}
    >
      {error ? <p className="has-text-danger">{error}</p> : null}
      <GameVariants
        metaGame={fixedMetaGame}
        variantsSetter={setSelectedVariants}
      />
      <div className="field">
        <label className="label" htmlFor="solo-challenge-seed">
          {t("solo.seedLabel")}
        </label>
        <div className="control">
          <input
            id="solo-challenge-seed"
            className="input"
            type="text"
            value={challengeSeed}
            onChange={(event) => setChallengeSeed(event.target.value)}
            placeholder={t("solo.seedPlaceholder")}
          />
        </div>
        <p className="help">{t("solo.seedHelp")}</p>
      </div>
    </Modal>
  );
}

export default SoloPlayModal;
