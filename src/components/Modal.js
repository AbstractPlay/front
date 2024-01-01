import PropTypes from "prop-types";

const Modal = ({ children, show, title, buttons }) => {
  if (!show) {
    return null;
  }

  if (buttons.length < 1) {
    console.log(
      "Must provide at least one button to the modal. The last button in the list should be the 'close' or 'cancel' action."
    );
    return null;
  }
  for (const btn of buttons) {
    // eslint-disable-next-line no-prototype-builtins
    if (!btn.hasOwnProperty("label") || !btn.hasOwnProperty("action")) {
      console.log("Every button requires a 'label' and an 'action'.");
      return null;
    }
  }
  const closeModal = buttons[buttons.length - 1].action;

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={closeModal} />
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{title}</p>
          <button className="delete" onClick={closeModal} />
        </header>
        <section className="modal-card-body">{children}</section>
        <footer className="modal-card-foot">
          <div className="field is-grouped">
            {buttons.map((btn, i) => (
              <button
                key={`modalButton${i}`}
                className={`button${
                  i !== buttons.length - 1 ? " apButton" : " apButtonNeutral"
                }`}
                onClick={btn.action}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
};

Modal.propTypes = {
  show: PropTypes.bool.isRequired,
  title: PropTypes.string,
  buttons: PropTypes.array,
};

export default Modal;
