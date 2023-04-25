import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { addResource } from '@abstractplay/gameslib';

function Footer(props) {
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  },[i18n.language]);

  return (
    <footer className="footer">
        <div className="content has-text-centered">
            <p>
                {t("ValueForValue")} <a href="https://paypal.me/abstractplay">paypal.me/abstractplay</a>. {t("ThankYouExclaim")}
            </p>
        </div>
    </footer>
  );
}

export default Footer;
