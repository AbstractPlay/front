import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import ClipboardCopy from "../../lib/ClipboardCopy";

function BotCredentialsModal({
  show,
  clientId,
  clientSecret,
  showClientId = true,
  idLabel,
  title,
  onClose,
}) {
  const { t } = useTranslation();
  const [acknowledged, acknowledgedSetter] = useState(false);
  const resolvedIdLabel = idLabel ?? t("bots.clientId");

  useEffect(() => {
    if (show) {
      acknowledgedSetter(false);
    }
  }, [show, clientId, clientSecret]);

  const handleClose = () => {
    if (!acknowledged) return;
    acknowledgedSetter(false);
    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <Modal
      show={show}
      title={title}
      disableBackdropClose={!acknowledged}
      buttons={[
        {
          label: t("Done"),
          action: handleClose,
          disabled: !acknowledged,
        },
      ]}
    >
      <div className="notification is-warning">
        {showClientId
          ? t("bots.credentialsWarningBoth")
          : t("bots.credentialsWarningSecretOnly")}
      </div>
      {showClientId ? (
        <div className="field">
          <label className="label is-small">{resolvedIdLabel}</label>
          <ClipboardCopy copyText={clientId || ""} />
        </div>
      ) : null}
      <div className="field">
        <label className="label is-small">{t("bots.clientSecret")}</label>
        <ClipboardCopy copyText={clientSecret || ""} />
      </div>
      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => acknowledgedSetter(e.target.checked)}
          />{" "}
          {t("bots.ackSecretStored")}
        </label>
      </div>
    </Modal>
  );
}

BotCredentialsModal.propTypes = {
  show: PropTypes.bool.isRequired,
  clientId: PropTypes.string,
  clientSecret: PropTypes.string,
  showClientId: PropTypes.bool,
  idLabel: PropTypes.string,
  title: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default BotCredentialsModal;
