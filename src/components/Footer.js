import React from "react";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import LanguagePicker from "./LanguagePicker";

function Footer(props) {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="content has-text-centered">
        <p>
          <a
            href="https://abstractplay.com/wiki"
            target="_blank"
            rel="noreferrer"
          >
            {t("footer.wiki")}
          </a>
          &nbsp;|&nbsp;
          <a
            href="https://discord.abstractplay.com"
            target="_blank"
            rel="noreferrer"
          >
            {t("footer.discord")}
          </a>
          &nbsp;|&nbsp;
          <a
            href="https://bgg.abstractplay.com"
            target="_blank"
            rel="noreferrer"
          >
            {t("footer.boardGameGeek")}
          </a>
          &nbsp;|&nbsp;
          <a
            href="https://wishlist.abstractplay.com"
            target="_blank"
            rel="noreferrer"
          >
            {t("footer.wishlist")}
          </a>
          &nbsp;|&nbsp;
          <a
            href="https://github.com/AbstractPlay"
            target="_blank"
            rel="noreferrer"
          >
            {t("footer.github")}
          </a>
          &nbsp;|&nbsp;
          <LanguagePicker />
          <br />
          <Link to="/legal">{t("footer.legalLink")}</Link>
        </p>
        <p style={{ fontWeight: "bolder", color: "red" }}>
          {t("footer.betaBanner")}
        </p>
        <p>
          {t("footer.feedback")}
          <br />
          <Trans
            i18nKey="footer.feedbackJoin"
            components={[
              <a
                key="discord"
                href="https://discord.gg/7dmx7BwRzg"
                target="_blank"
                rel="noreferrer"
              />,
            ]}
          />
        </p>
      </div>
    </footer>
  );
}

export default Footer;
