import { useEffect, useRef } from "react";

/**
 * Wraps a dropdown trigger and panel. Closes on outside click or Escape.
 * Parent renders trigger + conditional panel as children.
 */
function NavDropdownPanel({ open, onClose, className = "", children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      ref={rootRef}
      className={className ? `nav-dropdown-root ${className}` : "nav-dropdown-root"}
    >
      {children}
    </div>
  );
}

export default NavDropdownPanel;
