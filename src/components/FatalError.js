import PropTypes from "prop-types";

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
  const chunkError = isChunkLoadError(error);

  const content = (
    <article className="content">
      <h1 className="has-text-centered title">Something went wrong</h1>
      {chunkError ? (
        <p>
          A new version of the site may be available. Please refresh the page.
        </p>
      ) : (
        <p>
          Please refresh the page. If the problem persists, please{" "}
          <a href="https://discord.abstractplay.com">
            report it on our Discord server
          </a>
          .
        </p>
      )}
      <p className="has-text-centered">
        <button
          type="button"
          className="button apButton"
          onClick={() => window.location.reload()}
        >
          Refresh
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
