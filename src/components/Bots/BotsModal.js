import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "../Modal";
import Spinner from "../Spinner";
import { useStore } from "../../stores";
import { useTranslation } from "react-i18next";
import BotEditModal from "./BotEditModal";
import BotCredentialsModal from "./BotCredentialsModal";
import { createBot, refreshMe } from "./botApi";
import {
  getBotClientId,
  findBotByClientId,
  formatDisplayName,
} from "./botUtils";

function truncate(str, max = 40) {
  if (!str || str.length <= max) return str || "";
  return `${str.slice(0, max)}…`;
}

function BotsModal({ show, onClose }) {
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const bots = globalMe?.bots ?? [];

  const [newName, newNameSetter] = useState("");
  const [newEndpoint, newEndpointSetter] = useState("");
  const [error, errorSetter] = useState("");
  const [creating, creatingSetter] = useState(false);
  const [editingBot, editingBotSetter] = useState(null);
  const [credentials, credentialsSetter] = useState(null);

  useEffect(() => {
    if (show) {
      refreshMe();
    }
  }, [show]);

  useEffect(() => {
    if (editingBot === null) return;
    const latest = findBotByClientId(bots, getBotClientId(editingBot));
    if (!latest) return;
    if (
      latest.secretRotationPending !== editingBot.secretRotationPending ||
      latest.pendingSecretId !== editingBot.pendingSecretId ||
      latest.name !== editingBot.name ||
      latest.endpoint !== editingBot.endpoint ||
      latest.description !== editingBot.description
    ) {
      editingBotSetter(latest);
    }
  }, [bots, editingBot]);

  const resetCreateForm = () => {
    newNameSetter("");
    newEndpointSetter("");
    errorSetter("");
  };

  const isHttps = (url) => /^https:\/\/.+/i.test(url.trim());

  const updateBots = (updater) => {
    const { setGlobalMe } = useStore.getState();
    setGlobalMe((prev) => {
      if (!prev) return prev;
      const current = prev.bots ?? [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, bots: next };
    });
  };

  const handleBotUpdated = (updatedBot) => {
    updateBots((current) =>
      current.map((b) =>
        getBotClientId(b) === getBotClientId(updatedBot) ? updatedBot : b
      )
    );
    if (getBotClientId(editingBot) === getBotClientId(updatedBot)) {
      editingBotSetter(updatedBot);
    }
  };

  const handleBotDeleted = (clientId) => {
    updateBots((current) =>
      current.filter((b) => getBotClientId(b) !== clientId)
    );
    editingBotSetter(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      errorSetter(t("bots.errors.nameRequired"));
      return;
    }
    if (!isHttps(newEndpoint)) {
      errorSetter(t("bots.errors.httpsRequired"));
      return;
    }
    creatingSetter(true);
    errorSetter("");
    const result = await createBot({
      name: newName.trim(),
      endpoint: newEndpoint.trim(),
    });
    creatingSetter(false);
    if (!result.ok) {
      errorSetter(result.error || t("bots.errors.createFailed"));
      return;
    }
    const { clientId, clientSecret } = result.data ?? {};
    if (!clientId || !clientSecret) {
      errorSetter(t("bots.errors.missingCredentials"));
      return;
    }
    const refreshResult = await refreshMe();
    if (!refreshResult.ok) {
      errorSetter(
        refreshResult.error || t("bots.errors.refreshFailed")
      );
    }
    resetCreateForm();
    credentialsSetter({ clientId, clientSecret });
  };

  const handleClose = () => {
    resetCreateForm();
    editingBotSetter(null);
    credentialsSetter(null);
    onClose();
  };

  return (
    <>
      <Modal
        show={show}
        title={t("bots.manageTitle")}
        buttons={[
          {
            label: t("Close"),
            action: handleClose,
          },
        ]}
      >
        <div className="content">
          <p>{t("bots.intro")}</p>
        </div>
        {error ? (
          <div className="notification is-danger is-light">{error}</div>
        ) : null}
        <h4 className="title is-6">{t("bots.createTitle")}</h4>
        <div className="field is-horizontal">
          <div className="field-body">
            <div className="field">
              <label className="label is-small" htmlFor="newBotName">
                {t("bots.name")}
              </label>
              <div className="control">
                <input
                  className="input is-small"
                  id="newBotName"
                  type="text"
                  value={newName}
                  onChange={(e) => newNameSetter(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label className="label is-small" htmlFor="newBotEndpoint">
                {t("bots.httpsEndpoint")}
              </label>
              <div className="control">
                <input
                  className="input is-small"
                  id="newBotEndpoint"
                  type="url"
                  value={newEndpoint}
                  onChange={(e) => newEndpointSetter(e.target.value)}
                  placeholder={t("bots.endpointPlaceholder")}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="field">
          <div className="control">
            <button
              className="button is-small apButton"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? <Spinner /> : t("bots.createBot")}
            </button>
          </div>
        </div>
        <h4 className="title is-6">{t("bots.yourBots")}</h4>
        {bots.length === 0 ? (
          <p className="help">{t("bots.noBotsYet")}</p>
        ) : (
          <table className="table is-fullwidth apTable">
            <thead>
              <tr>
                <th>{t("bots.name")}</th>
                <th>{t("bots.httpsEndpoint")}</th>
                <th>{t("bots.clientId")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bots.map((bot) => (
                <tr key={getBotClientId(bot)}>
                  <td>
                    {formatDisplayName(bot.name, true)}
                    {bot.secretRotationPending ? (
                      <span className="tag is-warning is-light ml-2">
                        {t("bots.rotationPending")}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <tt>{truncate(bot.endpoint)}</tt>
                  </td>
                  <td>
                    <tt>{truncate(getBotClientId(bot), 20)}</tt>
                  </td>
                  <td>
                    <button
                      className="button is-small apButtonNeutral"
                      onClick={() =>
                        editingBotSetter(
                          findBotByClientId(bots, getBotClientId(bot)) ?? bot
                        )
                      }
                    >
                      {t("Edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
      <BotEditModal
        show={editingBot !== null}
        bot={editingBot}
        onClose={() => editingBotSetter(null)}
        onBotUpdated={handleBotUpdated}
        onBotDeleted={handleBotDeleted}
      />
      <BotCredentialsModal
        show={credentials !== null}
        clientId={credentials?.clientId}
        clientSecret={credentials?.clientSecret}
        title={t("bots.credentialsTitle")}
        onClose={() => credentialsSetter(null)}
      />
    </>
  );
}

BotsModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BotsModal;
