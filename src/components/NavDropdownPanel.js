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
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const root = rootRef.current;
      if (!root) {
        return;
      }
      if (!root.contains(target)) {
        onClose();
        return;
      }
      const panel = root.querySelector(".nav-dropdown-panel");
      if (!panel?.contains(target)) {
        return;
      }
      const dismissTarget = target.closest('a[href], [role="menuitem"]');
      if (dismissTarget && panel.contains(dismissTarget)) {
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
