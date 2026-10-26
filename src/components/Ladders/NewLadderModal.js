import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { getGameDisplayName } from "../../lib/gameOptions";
import { ladderPlaySupported } from "../../lib/ladderGame";
import Modal from "../Modal";
import GameVariants from "../GameVariants";
import GamePickerTrigger from "../GamePickerTrigger";
import { validateChallengeVariantSelection } from "../../lib/variantChallengeValidation";
import { useVariantSelectionValidity } from "../../hooks/useVariantSelectionValidity";

function NewLadderModal(props) {
  const { handleClose, handleNewLadder, show, fixedMetaGame } = props;
  const [metaGame, metaGameSetter] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const { variantsValid, onValidityChange, resetVariantValidity } =
    useVariantSelectionValidity();
  const [error, errorSetter] = useState("");
  const { t } = useTranslation();

  const handleVariantValidityChange = useCallback(
    (valid) => {
      onValidityChange(valid);
      if (valid) {
        errorSetter("");
      }
    },
    [onValidityChange]
  );

  const handleChangeGame = useCallback(
    (game) => {
      if (game === "") {
        metaGameSetter(null);
      } else {
        metaGameSetter(game);
      }
      errorSetter("");
      resetVariantValidity();
    },
    [resetVariantValidity]
  );

  useEffect(() => {
    if (fixedMetaGame !== undefined) {
      metaGameSetter(fixedMetaGame);
      handleChangeGame(fixedMetaGame);
    } else {
      metaGameSetter(null);
    }
    errorSetter("");
  }, [show, fixedMetaGame, handleChangeGame]);

  const handleNew = async () => {
    if (metaGame === null) {
      errorSetter(t("SelectAGame"));
      return;
    }
    if (!ladderPlaySupported(metaGame)) {
      errorSetter(t("Ladder.unsupportedGame"));
      return;
    }
    if (!validateChallengeVariantSelection(metaGame, selectedVariants).ok) {
      errorSetter(t("InvalidVariantCombination"));
      return;
    }
    const ok = await handleNewLadder({
      metaGame,
      variants: selectedVariants,
    });
    if (!ok) {
      errorSetter(t("Ladder.duplicate"));
      return;
    }
    handleClose();
  };

  if (fixedMetaGame && !gameinfo.has(fixedMetaGame)) {
    return null;
  }
  if (fixedMetaGame && !ladderPlaySupported(fixedMetaGame)) {
    return null;
  }

  return (
    <Modal
      show={show}
      title={t("Ladder.createTitle")}
      buttons={[
        {
          label: t("Submit"),
          action: handleNew,
          disabled: metaGame !== null && !variantsValid,
        },
        { label: t("Close"), action: handleClose },
      ]}
    >
      <div className="container">
        {fixedMetaGame ? (
          <p>
            <strong>{t("ChooseGame")}</strong>:{" "}
            {getGameDisplayName(fixedMetaGame)}
          </p>
        ) : (
          <div className="field">
            <label className="label" htmlFor="ladderGameName">
              {t("ChooseGame")}
            </label>
            <div className="control">
              <GamePickerTrigger
                id="ladderGameName"
                value={metaGame ?? ""}
                onChange={handleChangeGame}
                tournamentOnly
              />
            </div>
          </div>
        )}
        <p className="help">{t("Ladder.createHelp")}</p>
        <GameVariants
          metaGame={metaGame}
          variantsSetter={setSelectedVariants}
          onValidityChange={handleVariantValidityChange}
        />
      </div>
      <div className="is-danger error">{error}</div>
    </Modal>
  );
}

export default NewLadderModal;
