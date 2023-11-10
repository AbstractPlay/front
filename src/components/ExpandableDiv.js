import { useRef } from "react";
import PropTypes from "prop-types";

const Modal = ({ children, expanded, numLines, handleClick }) => {
  //   const [height, heightSetter] = useState(0);
  //   const [showIcon, showIconSetter] = useState(false);
  const ref = useRef(null);
  const lineHeight = 1.5;

  //   useEffect(() => {
  //     heightSetter(ref.current.clientHeight)
  //   }, []);

  //   useEffect(() => {
  //     showIconSetter(! expanded);
  //   }, [expanded]);

  //   useEffect(() => {
  //     if ( (! expanded) && (height >= lineHeight * numLines * 16)) {
  //         showIconSetter(false);
  //     } else {
  //         showIconSetter(! expanded);
  //     }
  //   }, [height, expanded, numLines]);

  return (
    <div
      style={{
        lineHeight: `${lineHeight}em`,
        height: expanded ? "auto" : `${numLines * lineHeight}em`,
        overflow: "hidden",
        position: "relative",
      }}
      ref={ref}
      onClick={handleClick}
    >
      {expanded ? (
        ""
      ) : (
        <span
          className="icon is-small"
          style={{ position: "absolute", right: 0, bottom: "-0.5em" }}
        >
          <i className="fa fa-ellipsis-h"></i>
        </span>
      )}
      {children}
    </div>
  );
};

Modal.propTypes = {
  children: PropTypes.element.isRequired,
  expanded: PropTypes.bool.isRequired,
  numLines: PropTypes.number,
};

Modal.defaultProps = {
  numLines: 3,
};

export default Modal;
