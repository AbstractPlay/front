import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "../Modal";
import Spinner from "../Spinner";
import BotCredentialsModal from "./BotCredentialsModal";
import {
  updateBot,
  deleteBot,
  beginBotSecretRotation,
  finalizeBotSecretRotation,
  refreshMe,
} from "./botApi";
import { getBotClientId, findBotByClientId } from "./botUtils";
import { useStore } from "../../stores";
import { useTranslation, Trans } from "react-i18next";

function BotEditModal({ show, bot, onClose, onBotUpdated, onBotDeleted }) {
  const { t } = useTranslation();
  const [name, nameSetter] = useState("");
  const [endpoint, endpointSetter] = useState("");
  const [description, descriptionSetter] = useState("");
  const [error, errorSetter] = useState("");
  const [saving, savingSetter] = useState(false);
  const [rotating, rotatingSetter] = useState(false);
  const [finalizing, finalizingSetter] = useState(false);
  const [showDeleteConfirm, showDeleteConfirmSetter] = useState(false);
  const [credentials, credentialsSetter] = useState(null);

  useEffect(() => {
    if (show && bot) {
      nameSetter(bot.name || "");
      endpointSetter(bot.endpoint || "");
      descriptionSetter(bot.description || "");
      errorSetter("");
      showDeleteConfirmSetter(false);
    }
  }, [show, bot]);

  useEffect(() => {
    if (show && bot) {
      credentialsSetter(null);
    }
    // Reset credentials only when opening the modal for a bot (by sk), not on
    // in-session updates such as marking rotation pending.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, bot?.sk]);

  const isHttps = (url) => /^https:\/\/.+/i.test(url.trim());

  const syncBotFromMe = () => {
    const clientId = getBotClientId(bot);
    const { globalMe } = useStore.getState();
    const updated = findBotByClientId(globalMe?.bots, clientId);
    if (updated) {
      onBotUpdated(updated);
    }
    return updated;
  };

  const handleSave = async () => {
    if (!bot) return;
    if (!name.trim()) {
      errorSetter(t("bots.errors.nameRequired"));
      return;
    }
    if (!isHttps(endpoint)) {
      errorSetter(t("bots.errors.httpsRequired"));
      return;
    }
    savingSetter(true);
    errorSetter("");
    const result = await updateBot({
      clientId: getBotClientId(bot),
      name: name.trim(),
      endpoint: endpoint.trim(),
      description: description.trim(),
    });
    savingSetter(false);
    if (!result.ok) {
      errorSetter(result.error || t("bots.errors.updateFailed"));
      return;
    }
    onBotUpdated({
      ...bot,
      name: name.trim(),
      endpoint: endpoint.trim(),
      description: description.trim(),
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!bot) return;
    savingSetter(true);
    errorSetter("");
    const result = await deleteBot({ clientId: getBotClientId(bot) });
    savingSetter(false);
    showDeleteConfirmSetter(false);
    if (!result.ok) {
      errorSetter(result.error || t("bots.errors.deleteFailed"));
      return;
    }
    onBotDeleted(getBotClientId(bot));
    onClose();
  };

  const handleBeginRotation = async () => {
    if (!bot) return;
    rotatingSetter(true);
    errorSetter("");
    const result = await beginBotSecretRotation({
      clientId: getBotClientId(bot),
    });
    rotatingSetter(false);
    if (!result.ok) {
      errorSetter(result.error || t("bots.errors.rotationBeginFailed"));
      return;
    }
    const clientSecret = result.data?.clientSecret;
    if (!clientSecret) {
      errorSetter(t("bots.errors.noSecretReturned"));
      return;
    }
    const refreshResult = await refreshMe();
    if (!refreshResult.ok) {
      errorSetter(
        refreshResult.error || t("bots.errors.rotationRefreshFailed")
      );
    } else {
      syncBotFromMe();
    }
    credentialsSetter({ clientSecret, showClientId: false });
  };

  const handleFinalizeRotation = async () => {
    if (!bot) return;
    finalizingSetter(true);
    errorSetter("");
    const result = await finalizeBotSecretRotation({
      clientId: getBotClientId(bot),
    });
    finalizingSetter(false);
    if (!result.ok) {
      errorSetter(result.error || t("bots.errors.finalizeFailed"));
      return;
    }
    const refreshResult = await refreshMe();
    if (!refreshResult.ok) {
      errorSetter(
        refreshResult.error || t("bots.errors.finalizeRefreshFailed")
      );
      return;
    }
    syncBotFromMe();
    onClose();
  };

  if (!show || !bot) {
    return null;
  }

  return (
    <>
      <Modal
        show={show && !showDeleteConfirm && credentials === null}
        title={t("bots.editTitle", { name: bot.name })}
        buttons={[
          {
            label: saving ? t("bots.saving") : t("Save"),
            action: handleSave,
            disabled: saving || rotating || finalizing,
          },
          {
            label: t("Close"),
            action: onClose,
            disabled: saving || rotating || finalizing,
          },
        ]}
      >
        {error ? (
          <div className="notification is-danger is-light">{error}</div>
        ) : null}
        <div className="field">
          <label className="label is-small" htmlFor="botEditName">
            {t("bots.name")}
          </label>
          <div className="control">
            <input
              className="input is-small"
              id="botEditName"
              type="text"
              value={name}
              onChange={(e) => nameSetter(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label className="label is-small" htmlFor="botEditEndpoint">
            {t("bots.httpsEndpoint")}
          </label>
          <div className="control">
            <input
              className="input is-small"
              id="botEditEndpoint"
              type="url"
              value={endpoint}
              onChange={(e) => endpointSetter(e.target.value)}
              placeholder={t("bots.endpointPlaceholder")}
            />
          </div>
        </div>
        <div className="field">
          <label className="label is-small" htmlFor="botEditDescription">
            {t("bots.description")}
          </label>
          <div className="control">
            <textarea
              className="textarea is-small"
              id="botEditDescription"
              value={description}
              onChange={(e) => descriptionSetter(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="field">
          <label className="label is-small">{t("bots.clientId")}</label>
          <div className="control">
            <input
              className="input is-small"
              type="text"
              value={getBotClientId(bot)}
              readOnly
            />
          </div>
        </div>
        {bot.secretRotationPending ? (
          <div className="notification is-info is-light">
            {t("bots.rotationInProgress")}
          </div>
        ) : null}
        <div className="field is-grouped">
          <div className="control">
            <button
              className="button is-small apButton"
              onClick={handleBeginRotation}
              disabled={saving || rotating || finalizing}
            >
              {rotating ? <Spinner /> : t("bots.rotateSecret")}
            </button>
          </div>
          {bot.secretRotationPending ? (
            <div className="control">
              <button
                className="button is-small apButton"
                onClick={handleFinalizeRotation}
                disabled={saving || rotating || finalizing}
              >
                {finalizing ? <Spinner /> : t("bots.finalizeRotation")}
              </button>
            </div>
          ) : null}
          <div className="control">
            <button
              className="button is-small apButtonAlert"
              onClick={() => showDeleteConfirmSetter(true)}
              disabled={saving || rotating || finalizing}
            >
              {t("bots.deleteBot")}
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        show={showDeleteConfirm}
        title={t("bots.deleteTitle")}
        buttons={[
          {
            label: saving ? t("bots.deleting") : t("bots.yesDelete"),
            action: handleDelete,
            disabled: saving,
          },
          {
            label: t("bots.noCancel"),
            action: () => showDeleteConfirmSetter(false),
            disabled: saving,
          },
        ]}
      >
        <div className="content">
          <p>
            <Trans
              i18nKey="bots.deleteConfirm"
              values={{ name: bot.name }}
              components={[<tt key="tt" />]}
            />
          </p>
        </div>
      </Modal>
      <BotCredentialsModal
        show={credentials !== null}
        clientId={credentials?.clientId}
        clientSecret={credentials?.clientSecret}
        showClientId={credentials?.showClientId ?? true}
        title={t("bots.newSecretTitle")}
        onClose={() => credentialsSetter(null)}
      />
    </>
  );
}

BotEditModal.propTypes = {
  show: PropTypes.bool.isRequired,
  bot: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onBotUpdated: PropTypes.func.isRequired,
  onBotDeleted: PropTypes.func.isRequired,
};

export default BotEditModal;
