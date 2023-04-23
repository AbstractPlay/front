import "bulma/css/bulma.min.css";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { addResource } from '@abstractplay/gameslib';
import { Auth } from 'aws-amplify';
import logo from '../assets/AbstractPlayLogo.svg';
import LogInOutButton from "./LogInOutButton";

function Footer(props) {
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
    <footer className="footer">
        <div className="content has-text-centered">
            <p>
                We believe in the "value for value" model. If you find this site valuable, consider a donation proportional to that value: <a href="https://paypal.me/abstractplay">paypal.me/abstractplay</a>. Thank you!
            </p>
        </div>
    </footer>
  );
}

export default Footer;
