import React, { useEffect, Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { addResource } from "@abstractplay/gameslib";

function NotFound(props) {
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  const [path, pathSetter] = useState(window.location.pathname);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (
      props.path !== undefined &&
      props.path !== null &&
      props.path.length > 0
    ) {
      pathSetter(props.path);
    } else {
      pathSetter(window.location.pathname);
    }
  }, [props]);

  return (
    <Fragment>
      <article className="content">
        <h1 className="has-text-centered title">{t("404")}</h1>
        <p>
          No page could be found at <code>{path}</code>. Please use the
          navigation bar to try again. If the problem persists, please{" "}
          <a href="https://discord.abstractplay.com">
            post a bug report on our Discord server
          </a>
          .
        </p>
      </article>
    </Fragment>
  );
}

export default NotFound;
