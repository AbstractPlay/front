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
import NavbarHoverDropdown, {
  NavbarHoverDropdownAnchor,
  NavbarHoverDropdownLink,
} from "./NavbarHoverDropdown";

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
          <NavbarHoverDropdown
            label={t("Games")}
            labelTo="/explore"
            closeBurger={closeBurger}
          >
            <NavbarHoverDropdownLink to="/explore">
              {t("nav.explore")}
            </NavbarHoverDropdownLink>
            <NavbarHoverDropdownLink to="/challenges">
              {t("nav.openChallenges")}
            </NavbarHoverDropdownLink>
            <NavbarHoverDropdownLink to="/recent-games">
              {t("nav.recentGames")}
            </NavbarHoverDropdownLink>
          </NavbarHoverDropdown>
          <div className="navbar-item">
            <Link
              to="/players"
              className="navbar-item"
              onClick={() => updateBurgerExpanded(false)}
            >
              {t("Players")}
            </Link>
          </div>
          <NavbarHoverDropdown label={t("EventsNav")} closeBurger={closeBurger}>
            <NavbarHoverDropdownLink to="/tournaments">
              {t("Tournament.Tournaments")}
            </NavbarHoverDropdownLink>
            <NavbarHoverDropdownLink to="/events">
              {t("Events.Name")}
            </NavbarHoverDropdownLink>
          </NavbarHoverDropdown>
          <NavbarHoverDropdown
            label={t("nav.community")}
            labelTo="/feedback/bugs"
            closeBurger={closeBurger}
          >
            <NavbarHoverDropdownLink to="/feedback/new?kind=bug">
              {t("nav.reportBug")}
            </NavbarHoverDropdownLink>
            <NavbarHoverDropdownLink to="/feedback/bugs">
              {t("nav.bugBoard")}
            </NavbarHoverDropdownLink>
            <NavbarHoverDropdownLink to="/feedback/ideas">
              {t("nav.featureIdeas")}
            </NavbarHoverDropdownLink>
            <NavbarHoverDropdownLink to="/wishlist">
              {t("nav.gameWishlist")}
            </NavbarHoverDropdownLink>
            {loggedin ? (
              <NavbarHoverDropdownLink to="/feedback/mine">
                {t("nav.myFeedback")}
              </NavbarHoverDropdownLink>
            ) : null}
          </NavbarHoverDropdown>
          <NavbarHoverDropdown label={t("About")} closeBurger={closeBurger}>
            <NavbarHoverDropdownLink to="/stats">
              {t("Statistics")}
            </NavbarHoverDropdownLink>
            <NavbarHoverDropdownLink to="/news">
              {t("News")}
            </NavbarHoverDropdownLink>
            <NavbarHoverDropdownLink to="/feedback/history">
              {t("nav.feedbackHistory")}
            </NavbarHoverDropdownLink>
            <NavbarHoverDropdownLink to="/about">
              {t("About")}
            </NavbarHoverDropdownLink>
            <hr className="navbar-divider" />
            <div className="navbar-item">{t("RelatedSites")}</div>
            <NavbarHoverDropdownAnchor
              href="https://records.abstractplay.com"
              target="_blank"
              rel="noreferrer"
            >
              Historical records
            </NavbarHoverDropdownAnchor>
            <NavbarHoverDropdownAnchor
              href="https://designer.abstractplay.com"
              target="_blank"
              rel="noreferrer"
            >
              Game designer
            </NavbarHoverDropdownAnchor>
            <NavbarHoverDropdownAnchor
              href="https://hwdiagrams.abstractplay.com"
              target="_blank"
              rel="noreferrer"
            >
              Homeworlds diagram generator
            </NavbarHoverDropdownAnchor>
            <NavbarHoverDropdownAnchor
              href="https://perlkonig.com/zendo"
              target="_blank"
              rel="noreferrer"
            >
              Zendo client (synchronous)
            </NavbarHoverDropdownAnchor>
          </NavbarHoverDropdown>
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
