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
      <article className="content">
        <h1 className="has-text-centered title">{t("About")}</h1>
        <p>
          Abstract Play is a site that allows you to play abstract strategy board games against other players on the internet. These game are not real-time, meaning your opponent does not need to be online at the same time as you are. You can submit your move and come back later to see if your opponent has moved. We specialize in offbeat, perfect information games without any element of luck.
        </p>
      </article>
  );
}

export default About;
