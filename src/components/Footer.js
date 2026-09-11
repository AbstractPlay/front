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
          <Link to="/wishlist">
            {t("footer.wishlist")}
          </Link>
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
          <Trans
            i18nKey="footer.feedbackCta"
            components={[
              <Link key="bugs" to="/feedback/bugs" />,
              <Link key="ideas" to="/feedback/ideas" />,
              <Link key="report" to="/feedback/new?kind=bug" />,
              // eslint-disable-next-line jsx-a11y/anchor-has-content -- Trans injects anchor text from i18n
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
