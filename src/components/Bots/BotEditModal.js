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

function BotEditModal({ show, bot, onClose, onBotUpdated, onBotDeleted }) {
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
      errorSetter("Name is required.");
      return;
    }
    if (!isHttps(endpoint)) {
      errorSetter("Endpoint must be a valid HTTPS URL.");
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
      errorSetter(result.error || "Failed to update bot.");
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
      errorSetter(result.error || "Failed to delete bot.");
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
      errorSetter(result.error || "Failed to begin secret rotation.");
      return;
    }
    const clientSecret = result.data?.clientSecret;
    if (!clientSecret) {
      errorSetter("Server did not return a new client secret.");
      return;
    }
    const refreshResult = await refreshMe();
    if (!refreshResult.ok) {
      errorSetter(
        refreshResult.error ||
          "Secret rotation started but failed to refresh bot status."
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
      errorSetter(result.error || "Failed to finalize secret rotation.");
      return;
    }
    const refreshResult = await refreshMe();
    if (!refreshResult.ok) {
      errorSetter(
        refreshResult.error ||
          "Rotation finalized but failed to refresh bot status."
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
        title={`Edit bot: ${bot.name}`}
        buttons={[
          {
            label: saving ? "Saving…" : "Save",
            action: handleSave,
            disabled: saving || rotating || finalizing,
          },
          {
            label: "Close",
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
            Name
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
            HTTPS endpoint
          </label>
          <div className="control">
            <input
              className="input is-small"
              id="botEditEndpoint"
              type="url"
              value={endpoint}
              onChange={(e) => endpointSetter(e.target.value)}
              placeholder="https://example.com/bot"
            />
          </div>
        </div>
        <div className="field">
          <label className="label is-small" htmlFor="botEditDescription">
            Description
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
          <label className="label is-small">Client ID</label>
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
            Secret rotation is in progress. Deploy the new secret to your bot,
            verify it works, then finalize the rotation.
          </div>
        ) : null}
        <div className="field is-grouped">
          <div className="control">
            <button
              className="button is-small apButton"
              onClick={handleBeginRotation}
              disabled={saving || rotating || finalizing}
            >
              {rotating ? <Spinner /> : "Rotate secret"}
            </button>
          </div>
          {bot.secretRotationPending ? (
            <div className="control">
              <button
                className="button is-small apButton"
                onClick={handleFinalizeRotation}
                disabled={saving || rotating || finalizing}
              >
                {finalizing ? <Spinner /> : "Finalize rotation"}
              </button>
            </div>
          ) : null}
          <div className="control">
            <button
              className="button is-small apButtonAlert"
              onClick={() => showDeleteConfirmSetter(true)}
              disabled={saving || rotating || finalizing}
            >
              Delete bot
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        show={showDeleteConfirm}
        title="Delete bot"
        buttons={[
          {
            label: saving ? "Deleting…" : "Yes, delete it",
            action: handleDelete,
            disabled: saving,
          },
          {
            label: "No, cancel",
            action: () => showDeleteConfirmSetter(false),
            disabled: saving,
          },
        ]}
      >
        <div className="content">
          <p>
            You are about to delete the bot <tt>{bot.name}</tt>. This will
            unlink all past game records from this bot. If you just lost your
            client secret, you can generate a new one using the "Rotate secret"
            button. Deleting a bot cannot be undone! Are you sure you want to
            delete this bot?
          </p>
        </div>
      </Modal>
      <BotCredentialsModal
        show={credentials !== null}
        clientId={credentials?.clientId}
        clientSecret={credentials?.clientSecret}
        showClientId={credentials?.showClientId ?? true}
        title="New bot secret"
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
