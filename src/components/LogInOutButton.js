import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { redirectToSignIn } from "../lib/amplifyAuth";
import UserSettingsModal from "./UserSettingsModal";
import NewProfile from "./NewProfile";
import { useStore } from "../stores";
import { useAuthSession } from "../hooks/useAuthSession";
import { fetchProfile } from "../lib/globalMeBootstrap";

function LogInOutButton({ closeBurger, variant = "default" }) {
  const { t } = useTranslation();
  const { status, userId, username } = useAuthSession();
  const [showUserSettingsModal, showUserSettingsModalSetter] = useState(false);
  const [showNewProfileModal, showNewProfileModalSetter] = useState(false);
  const globalMe = useStore((state) => state.globalMe);

  const handleSettingsClick = () => {
    if (!globalMe || globalMe.id === undefined) {
      showNewProfileModalSetter(true);
    } else {
      showUserSettingsModalSetter(true);
    }
  };

  const handleUserSettingsClose = async (cnt) => {
    showUserSettingsModalSetter(false);
    if (cnt > 0) {
      await fetchProfile();
    }
  };

  const handleNewProfileClose = async (cnt) => {
    showNewProfileModalSetter(false);
    if (cnt > 0) {
      await fetchProfile();
    }
  };

  if (status !== "ready" || !userId) {
    return (
      <button
        className="button is-small apButton"
        onClick={() => redirectToSignIn()}
        id={variant === "compact" ? "login-button" : undefined}
      >
        {t("LogIn")}
      </button>
    );
  }

  const playerPath = `/player/${userId}`;
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

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          className="navbar-login-compact-profile"
          aria-label={t("UserSettings")}
          title={username}
          onClick={() => {
            closeBurger();
            handleSettingsClick();
          }}
        >
          <span className="icon">
            <i className="fa fa-user" aria-hidden="true"></i>
          </span>
        </button>
        {settingsModals}
      </>
    );
  }

  return (
    <div>
      <Link to={playerPath} onClick={() => closeBurger()}>
        {username}
      </Link>
      <button
        className="fabtn align-right userSettingsBtn"
        onClick={handleSettingsClick}
      >
        <i className="fa fa-cog"></i>
      </button>
      {settingsModals}
    </div>
  );
}

export default LogInOutButton;
