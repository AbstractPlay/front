import { Trans } from "react-i18next";

const ANY_ASCII_URL = "https://anyascii.com/";

export default function DisplayNameSearchHint() {
  return (
    <p className="help display-name-search-hint">
      <Trans
        i18nKey="players.nameSearchHint"
        components={{
          example: <span className="has-text-weight-semibold" />,
          anyAsciiLink: (
            <a
              href={ANY_ASCII_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="display-name-search-hint__link"
            >
              AnyAscii
            </a>
          ),
        }}
      />
    </p>
  );
}
