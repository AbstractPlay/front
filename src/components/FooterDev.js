import React from "react";
import { useTranslation } from "react-i18next";
import LanguagePicker from "./LanguagePicker";

function FooterDev(props) {
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();

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
        <p>
          <LanguagePicker />
        </p>
      </div>
    </footer>
  );
}

export default FooterDev;
