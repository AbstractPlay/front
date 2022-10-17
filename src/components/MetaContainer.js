import React, { useState, useEffect } from 'react';
import MetaItem from './MetaItem';
import { gameinfo } from '@abstractplay/gameslib';
import { useTranslation } from 'react-i18next';
import { addResource } from '@abstractplay/gameslib';
import { Link } from "react-router-dom";
import { Auth } from 'aws-amplify';

function MetaContainer(props) {
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

  console.log([...gameinfo.keys()]);
  return (
    <div className="main">
      <nav>
        <div>
          <Link to="/about">{t('About')}</Link>
        </div>
        { loggedin ?
          <div><Link to="/">{t('MyDashboard')}</Link></div>
          : ""
        }
      </nav>
      <article>
        <h1 className="centered">{t("AvailableGames")}</h1>
        <div className="metaGames">
          {[...gameinfo.keys()].sort().map(k =>
            <MetaItem key={gameinfo.get(k).uid} game={gameinfo.get(k)} />)
          }
        </div>
      </article>
    </div>
  );
}

export default MetaContainer;
