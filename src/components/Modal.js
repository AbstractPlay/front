import React from 'react';

function Modal(props) {
  const modalClassName = props.show ? "apModal display-block" : "apModal display-none";

  // Prevent background from scrolling while modal is open.
  props.show ? document.body.style.overflow = 'hidden' : document.body.style.overflow = 'unset';

  return (
    props.show ?
      <div className={modalClassName}>
        <div className={"apModalMain " + (props.size === "small" ? "small" : "large")}>
          <div className="apModalHeader">
            <span className="apModalHeaderTitle">{props.title}</span>
            <button className="apButton" onClick={props.buttons[props.buttons.length - 1].action}>X</button>
          </div>
          <div className="apModalBody">
            {props.children}
          </div>
          <div className="apModalFooter">
            { props.buttons.map((button, index) => <button key={"modalButton" + index} className="apButton apModalFooterButtons" onClick={button.action}>{button.label}</button>) }
          </div>
        </div>
      </div>
      : ''
  );
}

export default Modal;