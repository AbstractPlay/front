/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { addResource } from "@abstractplay/gameslib";
import { Auth } from "aws-amplify";
import logoLight from "../assets/AbstractPlayLogo-light.svg";
import logoDark from "../assets/AbstractPlayLogo-dark.svg";
import LogInOutButton from "./LogInOutButton";
import { NewsContext } from "../pages/Skeleton";
import { useStorageState } from "react-use-storage-state";

function Navbar(props) {
  const [loggedin, loggedinSetter] = useState(false);
  const [burgerExpanded, updateBurgerExpanded] = useState(false);
  const [news] = useContext(NewsContext);
  const [newsLastSeen] = useStorageState("news-last-seen", 0);
  const [maxNews, maxNewsSetter] = useState(Infinity);
  const [colorMode, colorModeSetter] = useStorageState("color-mode", "light");
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (news !== undefined && news.length > 0) {
      maxNewsSetter(Math.max(...news.map((n) => n.time)));
    } else {
      maxNewsSetter(Infinity);
    }
  }, [news]);

  useEffect(() => {
    async function fetchAuth() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      if (token !== null) loggedinSetter(true);
    }
    fetchAuth().catch(() => {
      /* Not authenticated, and that's OK */
    });
  }, []);

  const toggleColorMode = (e) => {
    // Switch to Light Mode
    if (e.currentTarget.classList.contains("light--hidden")) {
      //Sets the user's preference in local storage
      colorModeSetter("light");
      return;
    } else {
      // Sets the user's preference in local storage
      colorModeSetter("dark");
    }
  };

  return (
    <nav className="navbar" style={{ minHeight: "10vh" }}>
      <div className="navbar-brand">
        <div className="navbar-item">
          <Link to="/">
            {process.env.REACT_APP_REAL_MODE === "production" ? (
              <img
                src={colorMode === "light" ? logoLight : logoDark}
                alt="Abstract Play logo"
                width="100%"
                height="auto"
                style={{ maxHeight: "none" }}
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
        <a
          role="button"
          className={"navbar-burger" + (burgerExpanded ? " is-active" : "")}
          aria-label="menu"
          aria-expanded="false"
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
            <>
              <div className="navbar-item">
                <Link to="/" className="navbar-item">
                  {t("MyDashboard")}
                </Link>
              </div>
              <div className="navbar-item">
                <Link to="/playground" className="navbar-item">
                  {t("Playground")}
                </Link>
              </div>
            </>
          )}
          <div className="navbar-item">
            <Link to="/games" className="navbar-item">
              {t("Games")}
            </Link>
          </div>
          <div className="navbar-item">
            <Link to="/players" className="navbar-item">
              {t("Players")}
            </Link>
          </div>
          <div className="navbar-item has-dropdown is-hoverable">
            <a className="navbar-link">{t("EventsNav")}</a>
            <div className="navbar-dropdown">
              <div className="navbar-item">
                <Link to="/tournaments" className="navbar-item">
                  {t("Tournament.Tournaments")}
                </Link>
              </div>
              <div className="navbar-item">
                <Link to="/events" className="navbar-item">
                  {t("Events.Name")}
                </Link>
              </div>
            </div>
          </div>
          <div className="navbar-item has-dropdown is-hoverable">
            <a className="navbar-link">{t("About")}</a>
            <div className="navbar-dropdown">
              <div className="navbar-item">
                <Link to="/stats" className="navbar-item">
                  {t("Statistics")}
                </Link>
              </div>
              <div className="navbar-item">
                <Link to="/news" className="navbar-item">
                  {t("News")}
                  {newsLastSeen >= maxNews ? null : (
                    <span className="icon highlight">
                      &nbsp;
                      <i className="fa fa-eercast" aria-hidden="true"></i>
                    </span>
                  )}
                </Link>
              </div>
              <div className="navbar-item">
                <Link to="/about" className="navbar-item">
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
                >
                  Zendo client (synchronous)
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="navbar-end">
          <div className="navbar-item">
            {/* <!--- Light mode button ---> */}
            <button
              className="button is-small apButtonNeutral light--hidden"
              aria-label="Toggle light mode"
              onClick={toggleColorMode}
            >
              Toggle Light Mode
            </button>

            {/* <!--- Dark mode button ---> */}
            <button
              className="button is-small apButtonNeutral dark--hidden"
              aria-label="Toggle dark mode"
              onClick={toggleColorMode}
            >
              Toggle Dark Mode
            </button>
          </div>
          <div className="navbar-item tourSettings">
            <LogInOutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
