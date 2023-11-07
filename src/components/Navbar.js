/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { addResource } from "@abstractplay/gameslib";
import { Auth } from "aws-amplify";
import logo from "../assets/AbstractPlayLogo.svg";
import LogInOutButton from "./LogInOutButton";
import { NewsContext } from "../pages/Skeleton";
import { useStorageState } from "react-use-storage-state";

function Navbar(props) {
  const [loggedin, loggedinSetter] = useState(false);
  const [burgerExpanded, updateBurgerExpanded] = useState(false);
  const [news,] = useContext(NewsContext);
  const [newsLastSeen, ] = useStorageState("news-last-seen", 0);
  const [maxNews, maxNewsSetter] = useState(Infinity);
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if ( (news !== undefined) && (news.length > 0) ) {
        maxNewsSetter(Math.max(...news.map(n => n.time)));
    } else {
        maxNewsSetter(Infinity);
    }
  }, [maxNewsSetter, news]);

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

  return (
    <nav className="navbar" style={{ minHeight: "10vh" }}>
      <div className="navbar-brand">
        <div className="navbar-item">
          <Link to="/">
            {process.env.REACT_APP_REAL_MODE === "production" ? (
              <img
                src={logo}
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
            <div className="navbar-item">
              <Link to="/" className="navbar-item">
                {t("MyDashboard")}
              </Link>
            </div>
          )}
          <div className="navbar-item">
            <Link to="/games" className="navbar-item">
              {t("Games")}
            </Link>
          </div>
          <div className="navbar-item">
            <Link to="/stats" className="navbar-item">
              {t("Statistics")}
            </Link>
          </div>
          <div className="navbar-item">
            <Link to="/news" className="navbar-item">
              {t("News")}
              {newsLastSeen >= maxNews ? null :
                <span className="icon highlight">&nbsp;
                    <i className="fa fa-eercast" aria-hidden="true"></i>
                </span>
              }
            </Link>
          </div>
          <div className="navbar-item">
            <Link to="/about" className="navbar-item">
              {t("About")}
            </Link>
          </div>
        </div>
        <div className="navbar-end">
          <div className="navbar-item tourSettings">
            <LogInOutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
