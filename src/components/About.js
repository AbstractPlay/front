import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { addResource } from '@abstractplay/gameslib';

function About(props) {
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  },[i18n.language]);

  return (
      <article>
        <h1 className="centered">{t("About")}</h1>
        <p className="aboutText">
          A site that allows you to play abstract board games against other players on the internet. These game are not real-time, meaning your opponent does not need to be online
          at the same time as you are. You can submit your move and come back later to see if your opponent has moved. We specialize in offbeat perfect information games without
          an element of luck. For a list of currently implemented games click <Link to="/games">here</Link>.
        </p>
      </article>
  );
}

export default About;
