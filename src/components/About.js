import React, { useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { addResource } from "@abstractplay/gameslib";
import pkgInfo from "../../package.json";

function About(props) {
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  return (
    <Fragment>
      <article className="content">
        <h1 className="has-text-centered title">{t("About")}</h1>
        <p>
          Abstract Play is a site that allows you to play abstract strategy
          board games against other players on the internet. These games are not
          real-time, meaning your opponent does not need to be online at the
          same time as you are. You can submit your move and come back later to
          see if your opponent has moved. We specialize in offbeat, perfect
          information games without any element of luck.
        </p>
        <p>The site is completely free to join and play. We thank our corporate sponsor, <a href="https://store.looneylabs.com/">Looney Labs</a>, for helping us keep the lights on!</p>
        <p style={{ fontSize: "smaller", textAlign: "right" }}>
          Build: {pkgInfo.version}
        </p>
      </article>
    </Fragment>
  );
}

export default About;
