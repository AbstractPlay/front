import React, { useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { addResource } from "@abstractplay/gameslib";

function NotFound(props) {
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  return (
    <Fragment>
      <article className="content">
        <h1 className="has-text-centered title">{t("404")}</h1>
        <p>
          No page could be found at <code>{window.location.pathname}</code>. Please use the navigation bar to try again. If the problem persists, please <a href="https://discord.abstractplay.com">post a bug report on our Discord server</a>.
        </p>
      </article>
    </Fragment>
  );
}

export default NotFound;
