import PropTypes from 'prop-types';

const Modal = ({ children, closeModal, modalState, title }) => {
    if(!modalState) {
      return null;
    }

    return(
      <div className="modal is-active">
        <div className="modal-background" onClick={closeModal} />
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">{title}</p>
            <button className="delete" onClick={closeModal} />
          </header>
          <section className="modal-card-body">
            <div className="content">
              {children}
            </div>
          </section>
          <footer className="modal-card-foot">
            <a className="button" onClick={closeModal}>Close</a>
          </footer>
        </div>
      </div>
    );
}

Modal.propTypes = {
    closeModal: PropTypes.func.isRequired,
    modalState: PropTypes.bool.isRequired,
    title: PropTypes.string
}

export default Modal;
