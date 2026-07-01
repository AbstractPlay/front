import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "../Modal";
import ClipboardCopy from "../../lib/ClipboardCopy";

function BotCredentialsModal({
  show,
  clientId,
  clientSecret,
  showClientId = true,
  idLabel = "Client ID",
  title,
  onClose,
}) {
  const [acknowledged, acknowledgedSetter] = useState(false);

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
          label: "Done",
          action: handleClose,
          disabled: !acknowledged,
        },
      ]}
    >
      <div className="notification is-warning">
        {showClientId
          ? "These credentials are shown only once. Copy the client ID and client secret and store them securely before closing this dialog."
          : "Your client ID is unchanged. This new client secret is shown only once — copy and store it securely before closing this dialog."}
      </div>
      {showClientId ? (
        <div className="field">
          <label className="label is-small">{idLabel}</label>
          <ClipboardCopy copyText={clientId || ""} />
        </div>
      ) : null}
      <div className="field">
        <label className="label is-small">Client secret</label>
        <ClipboardCopy copyText={clientSecret || ""} />
      </div>
      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => acknowledgedSetter(e.target.checked)}
          />{" "}
          I have copied and securely stored the client secret
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
