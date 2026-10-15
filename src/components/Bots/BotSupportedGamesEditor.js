import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import GamePickerTrigger from "../GamePickerTrigger";
import GameVariants from "../GameVariants";
import { getGameDisplayName } from "../../lib/gameOptions";
import { formatVariantsJoined } from "../../lib/expandVariants";
import { validateChallengeVariantSelection } from "../../lib/variantChallengeValidation";
import { useVariantSelectionValidity } from "../../hooks/useVariantSelectionValidity";
import {
  botSupportedEntryKey,
  botSupportedVariantUids,
  findBotSupportedDuplicateIndex,
} from "../../lib/botSupportedGames";

function BotSupportedGamesEditor({ supported, onChange, disabled = false }) {
  const { t } = useTranslation();
  const [pendingMeta, pendingMetaSetter] = useState(null);
  const [pendingVariants, pendingVariantsSetter] = useState([]);
  const [addError, addErrorSetter] = useState("");
  const { variantsValid, onValidityChange, resetVariantValidity } =
    useVariantSelectionValidity();

  const resetPending = useCallback(() => {
    pendingMetaSetter(null);
    pendingVariantsSetter([]);
    addErrorSetter("");
    resetVariantValidity();
  }, [resetVariantValidity]);

  const handleMetaChange = (meta) => {
    pendingMetaSetter(meta);
    pendingVariantsSetter([]);
    addErrorSetter("");
    resetVariantValidity();
  };

  const handleRemove = (index) => {
    onChange(supported.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    addErrorSetter("");
    if (!pendingMeta) {
      addErrorSetter(t("bots.errors.supportedMetaRequired"));
      return;
    }
    if (!variantsValid) {
      addErrorSetter(t("bots.errors.supportedVariantsInvalid"));
      return;
    }
    const validation = validateChallengeVariantSelection(
      pendingMeta,
      pendingVariants
    );
    if (!validation.ok) {
      addErrorSetter(
        validation.message || t("bots.errors.supportedVariantsInvalid")
      );
      return;
    }
    const variants = botSupportedVariantUids(pendingMeta, pendingVariants);
    if (findBotSupportedDuplicateIndex(supported, pendingMeta, variants) >= 0) {
      addErrorSetter(t("bots.errors.supportedDuplicate"));
      return;
    }
    onChange([...supported, { meta: pendingMeta, variants }]);
    resetPending();
  };

  return (
    <div className="bot-supported-games">
      <label className="label is-small">{t("bots.supportedGames")}</label>
      <p className="help mb-2">{t("bots.supportedGamesHelp")}</p>
      {supported.length === 0 ? (
        <p className="help mb-3">{t("bots.supportedGamesEmpty")}</p>
      ) : (
        <table className="table is-fullwidth is-narrow apTable mb-3">
          <thead>
            <tr>
              <th>{t("Game")}</th>
              <th>{t("tables.variants")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {supported.map((entry, index) => {
              const variantLabel =
                entry.variants.length === 0
                  ? t("bots.supportedNoVariants")
                  : formatVariantsJoined(entry.meta, entry.variants);
              return (
                <tr key={botSupportedEntryKey(entry)}>
                  <td>
                    <Link to={`/games/${entry.meta}`}>
                      {getGameDisplayName(entry.meta)}
                    </Link>
                  </td>
                  <td>{variantLabel}</td>
                  <td className="has-text-right">
                    <button
                      type="button"
                      className="button is-small apButtonNeutral"
                      onClick={() => handleRemove(index)}
                      disabled={disabled}
                      aria-label={t("bots.removeSupportedGame")}
                    >
                      {t("bots.removeSupportedGame")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="bot-supported-games__add">
        <p className="label is-small mb-2">{t("bots.addSupportedGame")}</p>
        <div className="field is-grouped is-grouped-multiline">
          <div className="control">
            <GamePickerTrigger
              id="botSupportedGamePicker"
              value={pendingMeta}
              onChange={handleMetaChange}
            />
          </div>
        </div>
        {pendingMeta ? (
          <GameVariants
            key={pendingMeta}
            metaGame={pendingMeta}
            variantsSetter={pendingVariantsSetter}
            onValidityChange={onValidityChange}
          />
        ) : null}
        {addError ? (
          <p className="help is-danger" role="alert">{addError}</p>
        ) : null}
        <div className="field mt-2">
          <div className="control">
            <button
              type="button"
              className="button is-small apButton"
              onClick={handleAdd}
              disabled={disabled || !pendingMeta || !variantsValid}
            >
              {t("Add")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

BotSupportedGamesEditor.propTypes = {
  supported: PropTypes.arrayOf(
    PropTypes.shape({
      meta: PropTypes.string.isRequired,
      variants: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default BotSupportedGamesEditor;
