import PropTypes from "prop-types";
import { useTranslation, Trans } from "react-i18next";

function isChunkLoadError(error) {
  if (!error) {
    return false;
  }
  return (
    error.name === "ChunkLoadError" ||
    (typeof error.message === "string" &&
      error.message.includes("Loading chunk"))
  );
}

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
              <a key="link" href="https://discord.abstractplay.com" />,
            ]}
          />
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

export { isChunkLoadError };
export default FatalError;
