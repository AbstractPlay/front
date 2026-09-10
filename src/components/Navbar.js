/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import logoLight from "../assets/AbstractPlayLogo-light.svg";
import logoDark from "../assets/AbstractPlayLogo-dark.svg";
import ProfileMenu from "./ProfileMenu";
import NotificationBell from "./NotificationBell";
import ErrorBoundary from "./ErrorBoundary";
import { useStorageState } from "react-use-storage-state";
import { useStore } from "../stores";
import { useAuthSession } from "../hooks/useAuthSession";
import { REAL_MODE } from "../lib/realMode";
import Spinner from "./Spinner";
import {
  DEFAULT_COLOUR_CONTEXT_DARK,
  DEFAULT_COLOUR_CONTEXT_LIGHT,
} from "../lib/colourContextDefaults";

const ThemeCustomizer = lazy(() => import("./ThemeCustomizer"));

function Navbar() {
  const { status } = useAuthSession();
  const loggedin = status === "ready";
  const globalMe = useStore((state) => state.globalMe);
  const [burgerExpanded, updateBurgerExpanded] = useState(false);
  const [colorMode, colorModeSetter] = useStorageState("color-mode", "light");
  const [storedContextLight] = useStorageState(
    "stored-context-light",
    DEFAULT_COLOUR_CONTEXT_LIGHT
  );
  const [storedContextDark] = useStorageState(
    "stored-context-dark",
    DEFAULT_COLOUR_CONTEXT_DARK
  );
  const { t } = useTranslation();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [storedInvis, setStoredInvis] = useStorageState("invisible", false);

  useEffect(() => {
    useStore.getState().setInvisible(storedInvis);
  }, [storedInvis]);

  const closeBurger = () => {
    updateBurgerExpanded(false);
  };

  const toggleColorMode = () => {
    const next = colorMode === "light" ? "dark" : "light";
    colorModeSetter(next);
    document.documentElement.setAttribute("color-mode", next);
    useStore
      .getState()
      .setColourContext(next === "dark" ? storedContextDark : storedContextLight);
  };

  const profileMenuProps = {
    closeBurger,
    onCustomizeTheme: () => setShowThemeModal(true),
    colorMode,
    onToggleColorMode: toggleColorMode,
    visibleToOthers: !storedInvis,
    onVisibilityChange: (visible) => setStoredInvis(!visible),
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-item">
          <Link to="/" onClick={() => updateBurgerExpanded(false)}>
            {REAL_MODE === "production" ? (
              <img
                src={colorMode === "light" ? logoLight : logoDark}
                alt="Abstract Play logo"
              />
            ) : (
              <span>
                Abstract Play
                <br />
                DEVELOPMENT Server
              </span>
            )}
          </Link>
        </div>
        <div className="navbar-brand-actions navbar-icon-cluster-mobile">
          {loggedin && globalMe !== null ? (
            <NotificationBell closeBurger={closeBurger} />
          ) : null}
          <ProfileMenu
            {...profileMenuProps}
            showColorModeInMenu={true}
            loginButtonId="login-button"
          />
        </div>
        <a
          role="button"
          className={"navbar-burger" + (burgerExpanded ? " is-active" : "")}
          aria-label={t("a11y.menu")}
          aria-expanded={burgerExpanded}
          data-target="navbarMain"
          onClick={() => updateBurgerExpanded(!burgerExpanded)}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
      <div
        id="navbarMain"
        className={"navbar-menu" + (burgerExpanded ? " is-active" : "")}
      >
        <div className="navbar-start">
          {!loggedin ? (
            ""
          ) : (
            <div className="navbar-item">
              <Link
                to="/"
                className="navbar-item"
                onClick={() => updateBurgerExpanded(false)}
              >
                {t("MyDashboard")}
              </Link>
            </div>
          )}
          <div className="navbar-item">
            <Link
              to="/playground"
              className="navbar-item"
              onClick={() => updateBurgerExpanded(false)}
            >
              {t("Playground")}
            </Link>
          </div>
          <div className="navbar-item has-dropdown is-hoverable">
            <Link
              to="/explore"
              className="navbar-link"
              onClick={() => updateBurgerExpanded(false)}
            >
              {t("Games")}
            </Link>
            <div className="navbar-dropdown">
              <div className="navbar-item">
                <Link
                  to="/explore"
                  className="navbar-item"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  {t("nav.explore")}
                </Link>
              </div>
              <div className="navbar-item">
                <Link
                  to="/challenges"
                  className="navbar-item"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  {t("nav.openChallenges")}
                </Link>
              </div>
              <div className="navbar-item">
                <Link
                  to="/recent-games"
                  className="navbar-item"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  {t("nav.recentGames")}
                </Link>
              </div>
            </div>
          </div>
          <div className="navbar-item">
            <Link
              to="/players"
              className="navbar-item"
              onClick={() => updateBurgerExpanded(false)}
            >
              {t("Players")}
            </Link>
          </div>
          <div className="navbar-item has-dropdown is-hoverable">
            <a className="navbar-link">{t("EventsNav")}</a>
            <div className="navbar-dropdown">
              <div className="navbar-item">
                <Link
                  to="/tournaments"
                  className="navbar-item"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  {t("Tournament.Tournaments")}
                </Link>
              </div>
              <div className="navbar-item">
                <Link
                  to="/events"
                  className="navbar-item"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  {t("Events.Name")}
                </Link>
              </div>
            </div>
          </div>
          <div className="navbar-item has-dropdown is-hoverable">
            <a className="navbar-link">{t("About")}</a>
            <div className="navbar-dropdown">
              <div className="navbar-item">
                <Link
                  to="/stats"
                  className="navbar-item"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  {t("Statistics")}
                </Link>
              </div>
              <div className="navbar-item">
                <Link
                  to="/news"
                  className="navbar-item"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  {t("News")}
                </Link>
              </div>
              <div className="navbar-item">
                <Link
                  to="/about"
                  className="navbar-item"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  {t("About")}
                </Link>
              </div>
              <hr className="navbar-divider" />
              <div className="navbar-item">{t("RelatedSites")}</div>
              <div className="navbar-item">
                <a
                  className="navbar-item"
                  href="https://records.abstractplay.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  Historical records
                </a>
              </div>
              <div className="navbar-item">
                <a
                  className="navbar-item"
                  href="https://designer.abstractplay.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  Game designer
                </a>
              </div>
              <div className="navbar-item">
                <a
                  className="navbar-item"
                  href="https://hwdiagrams.abstractplay.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  Homeworlds diagram generator
                </a>
              </div>
              <div className="navbar-item">
                <a
                  className="navbar-item"
                  href="https://perlkonig.com/zendo"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => updateBurgerExpanded(false)}
                >
                  Zendo client (synchronous)
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="navbar-end">
          {loggedin ? (
            <>
              <div className="navbar-item navbar-dark-mode-desktop">
                <button
                  type="button"
                  aria-label={
                    colorMode === "light"
                      ? t("a11y.toggleDarkMode")
                      : t("a11y.toggleLightMode")
                  }
                  onClick={toggleColorMode}
                  title={
                    colorMode === "light"
                      ? t("a11y.toggleDarkMode")
                      : t("a11y.toggleLightMode")
                  }
                >
                  <span
                    className="icon"
                    style={{ fontSize: "1.4rem", fontWeight: "bold" }}
                  >
                    {colorMode === "light" ? "\u263E" : "\u263C"}
                  </span>
                </button>
              </div>
              <div className="navbar-item navbar-icon-cluster-desktop">
                {globalMe !== null ? (
                  <NotificationBell closeBurger={closeBurger} />
                ) : null}
                <ProfileMenu {...profileMenuProps} showColorModeInMenu={false} />
              </div>
            </>
          ) : (
            <div className="navbar-item navbar-login-desktop">
              <ProfileMenu {...profileMenuProps} showColorModeInMenu={false} />
            </div>
          )}
        </div>
      </div>
      <ErrorBoundary inline>
        <Suspense fallback={<Spinner />}>
          {showThemeModal ? (
            <ThemeCustomizer
              show={showThemeModal}
              handleClose={() => setShowThemeModal(false)}
            />
          ) : null}
        </Suspense>
      </ErrorBoundary>
    </nav>
  );
}

export default Navbar;
