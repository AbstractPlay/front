import React, { useEffect, Fragment, useState } from "react";
import { useTranslation, Trans } from "react-i18next";

function NotFound(props) {
  const { t } = useTranslation();

  const [path, pathSetter] = useState(window.location.pathname);

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
          <Trans
            i18nKey="notFound.body"
            values={{ path }}
            components={[
              <code key="code" />,
              <a
                key="link"
                href="https://discord.abstractplay.com"
                target="_blank"
                rel="noreferrer"
              />,
            ]}
          />
        </p>
      </article>
    </Fragment>
  );
}

export default NotFound;
