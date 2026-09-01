import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { getGameDisplayName } from "../../lib/gameOptions";
import { tournamentPlaySupported } from "../../lib/tournamentGame";
import Modal from "../Modal";
import GameVariants from "../GameVariants";
import GamePickerTrigger from "../GamePickerTrigger";
import { validateChallengeVariantSelection } from "../../lib/variantChallengeValidation";
import { useVariantSelectionValidity } from "../../hooks/useVariantSelectionValidity";

function NewTournamentModal(props) {
  const handleClose = props.handleClose;
  const handleNewTournament = props.handleNewTournament;
  const show = props.show;
  const fixedMetaGame = props.fixedMetaGame;
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
    if (props.fixedMetaGame !== undefined) {
      metaGameSetter(props.fixedMetaGame);
      handleChangeGame(props.fixedMetaGame);
    } else {
      metaGameSetter(null);
    }
    errorSetter("");
  }, [show, props, handleChangeGame]);

  const handleNew = async () => {
    if (metaGame === null) {
      errorSetter(t("SelectAGame"));
      return;
    }
    if (!validateChallengeVariantSelection(metaGame, selectedVariants).ok) {
      errorSetter(t("InvalidVariantCombination"));
      return;
    }
    if (
      !(await handleNewTournament({
        metaGame: metaGame,
        variants: selectedVariants,
      }))
    ) {
      errorSetter(t("Tournament.Duplicate"));
      return;
    }
    handleClose();
  };

  if (fixedMetaGame && !gameinfo.has(fixedMetaGame)) {
    return null;
  }
  if (fixedMetaGame && !tournamentPlaySupported(fixedMetaGame)) {
    return null;
  }

  return (
    <Modal
      show={show}
      title={t("Tournament.New1")}
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
            <label className="label" htmlFor="gameName">
              {t("ChooseGame")}
            </label>
            <div className="control">
              <GamePickerTrigger
                id="gameName"
                value={metaGame ?? ""}
                onChange={handleChangeGame}
                tournamentOnly
              />
            </div>
          </div>
        )}
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

export default NewTournamentModal;
