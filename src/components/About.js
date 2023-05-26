import React, { useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { addResource } from "@abstractplay/gameslib";
import { Helmet } from "react-helmet-async";
import pkgInfo from "../../package.json";

function About(props) {
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  return (
    <Fragment>
        <Helmet>
          <link rel="canonical" href="https://play.abstractplay.com/about" />
        </Helmet>
        <article className="content">
        <h1 className="has-text-centered title">{t("About")}</h1>
        <p>
            Abstract Play is a site that allows you to play abstract strategy board
            games against other players on the internet. These game are not
            real-time, meaning your opponent does not need to be online at the same
            time as you are. You can submit your move and come back later to see if
            your opponent has moved. We specialize in offbeat, perfect information
            games without any element of luck.
        </p>
        <p style={{ fontSize: "smaller", textAlign: "right" }}>
            Build: {pkgInfo.version}
        </p>
        </article>
    </Fragment>
  );
}

export default About;
