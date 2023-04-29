import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { addResource } from '@abstractplay/gameslib';

function Footer(props) {
  // eslint-disable-next-line no-unused-vars
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  },[i18n.language]);

  return (
    <footer className="footer">
        <div className="content has-text-centered">
            <p>
                <a href="https://www.abstractplay.com" target="_blank" rel="noreferrer">Website</a>&nbsp;|&nbsp;
                <a href="https://github.com/AbstractPlay" target="_blank" rel="noreferrer">GitHub</a>&nbsp;|&nbsp;
                <a href="https://discord.gg/7dmx7BwRzg" target="_blank" rel="noreferrer">Discord</a>
            </p>
            <p style={{fontWeight: "bolder", color: "red"}}>
                The site is currently in BETA testing!
            </p>
            <p>
                We're very happy with the core functionality, but we'd love some concrete feedback from users on how to make things better.<br/>Please come join us on <a href="https://discord.gg/7dmx7BwRzg" target="_blank" rel="noreferrer">Discord</a> and let us know if you run into any trouble or have any ideas.
            </p>
        </div>
    </footer>
  );
}

export default Footer;
