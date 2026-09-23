import { createContext, useCallback, useContext, useState } from "react";
import { Link } from "react-router-dom";

const NavbarHoverDropdownCloseContext = createContext(null);

function useCloseNavbarHoverDropdown() {
  const close = useContext(NavbarHoverDropdownCloseContext);
  return close ?? (() => {});
}

export function NavbarHoverDropdownLink({ to, className = "navbar-item", children, onClick, ...rest }) {
  const closeDropdown = useCloseNavbarHoverDropdown();
  return (
    <div className="navbar-item">
      <Link
        to={to}
        className={className}
        onClick={(event) => {
          closeDropdown();
          onClick?.(event);
        }}
        {...rest}
      >
        {children}
      </Link>
    </div>
  );
}

export function NavbarHoverDropdownAnchor({
  href,
  className = "navbar-item",
  children,
  onClick,
  ...rest
}) {
  const closeDropdown = useCloseNavbarHoverDropdown();
  return (
    <div className="navbar-item">
      <a
        href={href}
        className={className}
        onClick={(event) => {
          closeDropdown();
          onClick?.(event);
        }}
        {...rest}
      >
        {children}
      </a>
    </div>
  );
}

/**
 * Desktop: hover opens via Bulma is-active (not is-hoverable). Clicking a link closes
 * and navigates. Mobile: sub-links stay visible in the burger menu.
 */
export default function NavbarHoverDropdown({ label, labelTo, closeBurger, children }) {
  const [open, setOpen] = useState(false);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    closeBurger?.();
  }, [closeBurger]);

  const labelNode = labelTo ? (
    <Link to={labelTo} className="navbar-link" onClick={closeDropdown}>
      {label}
    </Link>
  ) : (
    <span className="navbar-link">{label}</span>
  );

  return (
    <NavbarHoverDropdownCloseContext.Provider value={closeDropdown}>
      <div
        className={"navbar-item has-dropdown" + (open ? " is-active" : "")}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {labelNode}
        <div className="navbar-dropdown">{children}</div>
      </div>
    </NavbarHoverDropdownCloseContext.Provider>
  );
}
