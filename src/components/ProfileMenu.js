import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { signOut } from "aws-amplify/auth";
import { redirectToSignIn } from "../lib/amplifyAuth";
import UserSettingsModal from "./UserSettingsModal";
import NewProfile from "./NewProfile";
import NavDropdownPanel from "./NavDropdownPanel";
import UserAvatar from "./UserAvatar";
import { useStore } from "../stores";
import { useAuthSession } from "../hooks/useAuthSession";
import { fetchProfile } from "../lib/globalMeBootstrap";

function ProfileMenu({
  closeBurger,
  onCustomizeTheme,
  showColorModeInMenu = false,
  colorMode,
  onToggleColorMode,
  loginButtonId,
  visibleToOthers = true,
  onVisibilityChange,
}) {
  const { t } = useTranslation();
  const { status, userId, username } = useAuthSession();
  const globalMe = useStore((state) => state.globalMe);
  const connections = useStore((state) => state.connections);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserSettingsModal, setShowUserSettingsModal] = useState(false);
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleNavigate = () => {
    closeMenu();
    if (closeBurger) {
      closeBurger();
    }
  };

  const handleSettingsClick = () => {
    closeMenu();
    if (!globalMe || globalMe.id === undefined) {
      setShowNewProfileModal(true);
    } else {
      setShowUserSettingsModal(true);
    }
  };

  const handleUserSettingsClose = async (cnt) => {
    setShowUserSettingsModal(false);
    if (cnt > 0) {
      await fetchProfile();
    }
  };

  const handleNewProfileClose = async (cnt) => {
    setShowNewProfileModal(false);
    if (cnt > 0) {
      await fetchProfile();
    }
  };

  const handleLogout = async () => {
    closeMenu();
    localStorage.removeItem("wasLoggedIn");
    sessionStorage.setItem("intentionalLogout", "1");
    const { setGlobalMe, clearAuthSession } = useStore.getState();
    await signOut();
    clearAuthSession();
    setGlobalMe(null);
    if (closeBurger) {
      closeBurger();
    }
  };

  const settingsModals = (
    <>
      <UserSettingsModal
        show={showUserSettingsModal}
        handleClose={handleUserSettingsClose}
      />
      <NewProfile
        show={showNewProfileModal}
        handleClose={handleNewProfileClose}
        updateMe={true}
      />
    </>
  );

  if (status !== "ready" || !userId) {
    return (
      <>
        <button
          type="button"
          className="button is-small apButton"
          onClick={() => redirectToSignIn()}
          id={loginButtonId}
        >
          {t("LogIn")}
        </button>
        {settingsModals}
      </>
    );
  }

  const playerPath = `/player/${userId}`;

  return (
    <>
      <NavDropdownPanel
        open={menuOpen}
        onClose={closeMenu}
        className="tourSettings"
      >
        <button
          type="button"
          className="nav-avatar-btn"
          aria-label={username}
          title={username}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <UserAvatar user={{ id: userId, settings: globalMe?.settings }} />
        </button>
        {menuOpen ? (
          <div className="nav-dropdown-panel nav-profile-menu" role="menu">
            {username ? (
              <p className="nav-profile-menu-header" role="presentation">
                {username}
              </p>
            ) : null}
            <Link
              to={playerPath}
              className="nav-profile-menu-item"
              role="menuitem"
              onClick={handleNavigate}
            >
              {t("nav.myProfile")}
            </Link>
            <button
              type="button"
              className="nav-profile-menu-item"
              role="menuitem"
              onClick={handleSettingsClick}
            >
              {t("UserSettings")}
            </button>
            <label className="nav-profile-menu-item nav-profile-menu-checkbox">
              <input
                type="checkbox"
                checked={visibleToOthers}
                onChange={(event) =>
                  onVisibilityChange?.(event.target.checked)
                }
              />
              <span>{t("nav.visibilityVisible")}</span>
            </label>
            <button
              type="button"
              className="nav-profile-menu-item"
              role="menuitem"
              onClick={() => {
                closeMenu();
                onCustomizeTheme();
              }}
            >
              {t("nav.customizeTheme")}
            </button>
            <div
              className="nav-profile-menu-item nav-profile-menu-static nav-profile-menu-wifi"
              role="none"
            >
              <span className="icon is-small">
                <i className="fa fa-wifi" aria-hidden="true"></i>
              </span>
              <span>
                {t("nav.activePlayers", {
                  count: connections?.totalCount ?? 0,
                })}
              </span>
            </div>
            {showColorModeInMenu ? (
              <button
                type="button"
                className="nav-profile-menu-item"
                role="menuitem"
                aria-label={
                  colorMode === "light"
                    ? t("a11y.toggleDarkMode")
                    : t("a11y.toggleLightMode")
                }
                onClick={() => {
                  closeMenu();
                  onToggleColorMode();
                }}
              >
                {colorMode === "light"
                  ? t("a11y.toggleDarkMode")
                  : t("a11y.toggleLightMode")}
              </button>
            ) : null}
            <hr className="nav-profile-menu-divider" />
            <button
              type="button"
              className="nav-profile-menu-item"
              role="menuitem"
              id="logout-button"
              onClick={handleLogout}
            >
              {t("LogOut")}
            </button>
          </div>
        ) : null}
      </NavDropdownPanel>
      {settingsModals}
    </>
  );
}

export default ProfileMenu;
