import { useEffect, useRef } from "react";

/**
 * Wraps a dropdown trigger and panel. Closes on outside click or Escape.
 * Parent renders trigger + conditional panel as children.
 * @param {((event: KeyboardEvent) => void) | undefined} onEscape
 *   Optional Escape handler; when set, replaces the default `onClose()` on Escape.
 */
function NavDropdownPanel({ open, onClose, onEscape, className = "", children }) {
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
        if (onEscape) {
          onEscape(event);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, onEscape]);

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
