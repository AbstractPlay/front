import React from "react";
import { Trans } from "react-i18next";

const GLICKO_WIKI_URL = "https://en.wikipedia.org/wiki/Glicko_rating_system";

function GlickoDisplayNote() {
  return (
    <p className="glicko-display-note is-size-7">
      <Trans
        i18nKey="glicko.displayNote"
        components={{
          wikiLink: (
            // eslint-disable-next-line jsx-a11y/anchor-has-content -- Trans injects anchor text from i18n
            <a
              href={GLICKO_WIKI_URL}
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
        }}
      />
    </p>
  );
}

export default GlickoDisplayNote;
