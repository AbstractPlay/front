import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { stashPendingError } from "../lib/feedback/feedbackContext";
import { feedbackNewPath } from "../lib/feedback/feedbackConstants";
import { isChunkLoadError } from "../lib/chunkLoadError";

const FatalError = ({ error, inline = false }) => {
  const { t } = useTranslation();
  const chunkError = isChunkLoadError(error);

  const content = (
    <article className="content">
      <h1 className="has-text-centered title">{t("fatalError.title")}</h1>
      {chunkError ? (
        <p>{t("fatalError.chunkMessage")}</p>
      ) : (
        <p>
          <Trans
            i18nKey="fatalError.genericMessage"
            components={[
              // eslint-disable-next-line jsx-a11y/anchor-has-content -- Trans injects anchor text from i18n
              <a key="discord" href="https://discord.abstractplay.com" />,
            ]}
          />
        </p>
      )}
      {!chunkError && error && (
        <p className="has-text-centered">
          <Link
            className="button apButtonNeutral"
            to={feedbackNewPath("bug")}
            onClick={() => stashPendingError(error)}
          >
            {t("feedback.bugs.report")}
          </Link>
        </p>
      )}
      <p className="has-text-centered">
        <button
          type="button"
          className="button apButton"
          onClick={() => window.location.reload()}
        >
          {t("Refresh")}
        </button>
      </p>
    </article>
  );

  if (inline) {
    return content;
  }

  return (
    <section className="section">
      <div className="container">{content}</div>
    </section>
  );
};

FatalError.propTypes = {
  error: PropTypes.object,
  inline: PropTypes.bool,
};

export { isChunkLoadError } from "../lib/chunkLoadError";
export default FatalError;
