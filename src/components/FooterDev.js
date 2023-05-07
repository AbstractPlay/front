import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { addResource } from "@abstractplay/gameslib";

function FooterDev(props) {
  // eslint-disable-next-line no-unused-vars
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  }, [i18n.language]);

  return (
    <footer className="footer">
      <div className="content has-text-centered">
        <p>
          This is the DEVELOPMENT server! User accounts and game records are
          completely separate from the main server.
        </p>
        <p>
          You are welcome to poke around here if you wish, but know that
          something could break at any time and that games are routinely purged.
        </p>
      </div>
    </footer>
  );
}

export default FooterDev;
