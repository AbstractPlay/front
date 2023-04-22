import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { addResource } from '@abstractplay/gameslib';
import { Auth } from 'aws-amplify';

function Navbar(props) {
  const [loggedin, loggedinSetter] = useState(false);
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  },[i18n.language]);

  useEffect(() => {
    async function fetchAuth() {
      const usr = await Auth.currentAuthenticatedUser();
      const token = usr.signInUserSession.idToken.jwtToken;
      if (token !== null)
        loggedinSetter(true);
    }
    fetchAuth();
  },[]);

  return (
    <nav>
    <li>
      <Link to="/games">{t("Games")}</Link>
    </li>
    { !loggedin ? "" :
      <li>
        <Link to="/">{t("MyDashboard")}</Link>
      </li>
    }
    <li>
      <Link to="/about">{t("About")}</Link>
    </li>
  </nav>
  );
}

export default Navbar;
