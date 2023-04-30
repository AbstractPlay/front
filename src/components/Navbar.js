import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { addResource } from "@abstractplay/gameslib";
import { Auth } from "aws-amplify";
import logo from "../assets/AbstractPlayLogo.svg";
import LogInOutButton from "./LogInOutButton";

function Navbar(props) {
  const [loggedin, loggedinSetter] = useState(false);
  const [update, updateSetter] = useState(0);
  const [burgerExpanded, updateBurgerExpanded] = useState(false);
  const [token, tokenSetter] = useState(null);
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    async function fetchAuth() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      if (token !== null) loggedinSetter(true);
    }
    fetchAuth();
  }, []);

  return (
    <nav className="navbar" style={{ minHeight: "10vh" }}>
      <div className="navbar-brand">
        <div className="navbar-item">
          <Link to="/">
            <img
              src={logo}
              alt="Abstract Play logo"
              width="100%"
              height="auto"
              style={{ maxHeight: "none" }}
            />
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
            <Link to="/about" className="navbar-item">
              {t("About")}
            </Link>
          </div>
        </div>
        <div className="navbar-end">
          <div className="navbar-item">
            <LogInOutButton token={token} updater={updateSetter} />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
