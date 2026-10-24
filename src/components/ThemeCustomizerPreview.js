import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import "./theme-customizer.css";

function PreviewCard({ title, tokens, children }) {
  const { t } = useTranslation();
  const list = Array.isArray(tokens) ? tokens : [tokens];

  return (
    <section className="theme-customizer-preview__card">
      <header className="theme-customizer-preview__card-header">{title}</header>
      <div className="theme-customizer-preview__card-body">{children}</div>
      {list.length > 0 ? (
        <footer
          className="theme-customizer-preview__card-vars"
          aria-label={t("theme.preview.usesVariables")}
        >
          <span className="theme-customizer-preview__vars-label">
            {t("theme.preview.usesVariables")}
          </span>
          <ul className="theme-customizer-preview__var-list">
            {list.map((token) => (
              <li key={token}>
                <span className="theme-customizer-preview__var-chip">{token}</span>
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </section>
  );
}

PreviewCard.propTypes = {
  title: PropTypes.string.isRequired,
  tokens: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]).isRequired,
  children: PropTypes.node,
};

function ThemeCustomizerPreview({ previewVars }) {
  const { t } = useTranslation();

  return (
    <div className="site-theme-page-preview">
      <div className="theme-customizer-preview" style={previewVars}>
        <h2 className="subtitle theme-customizer-preview__title">
          {t("Preview")}
        </h2>
        <p className="theme-customizer-preview__legend">{t("theme.preview.legend")}</p>

        <div className="theme-customizer-preview__cards">
          <PreviewCard
            title={t("theme.preview.typography")}
            tokens={[
              "--main-heading-color",
              "--main-font-color",
              "--secondary-font-color",
            ]}
          >
            <h1 className="title is-5">{t("theme.sampleHeading")}</h1>
            <p className="mt-2">{t("theme.sampleText")}</p>
            <p className="notification-panel-time mt-1">
              {t("theme.preview.notificationTime")}
            </p>
          </PreviewCard>

          <PreviewCard
            title={t("theme.preview.sectionTitle")}
            tokens="--main-fg-color"
          >
            <h2 className="subtitle lined theme-customizer-preview__lined">
              <span>{t("theme.preview.linedTitle")}</span>
            </h2>
          </PreviewCard>

          <PreviewCard
            title={t("theme.preview.buttons")}
            tokens={[
              "--secondary-color-3-lighter",
              "--secondary-color-3",
              "--secondary-color-1-lighter",
              "--secondary-color-1",
              "--bg-color2",
            ]}
          >
            <div className="buttons">
              <button type="button" className="button apButton">
                {t("theme.primaryButton")}
              </button>
              <button type="button" className="button apButtonAlert">
                {t("theme.alertButton")}
              </button>
              <button type="button" className="button apButtonNeutral">
                {t("theme.preview.neutralButton")}
              </button>
            </div>
          </PreviewCard>

          <PreviewCard
            title={t("theme.preview.accents")}
            tokens="--secondary-color-1"
          >
            <div className="theme-customizer-preview__accent-row">
              <span className="apTextAlert">{t("theme.preview.alertText")}</span>
              <span className="apBullet" aria-hidden="true">●</span>
              <span>{t("theme.preview.bulletSample")}</span>
              <span
                className="theme-customizer-preview__bell-wrap"
                title={t("theme.preview.badgeHint")}
              >
                <span
                  className="theme-customizer-preview__bell-icon"
                  aria-hidden="true"
                >
                  …
                </span>
                <span className="notification-bell-badge">3</span>
              </span>
            </div>
          </PreviewCard>

          <PreviewCard
            title={t("theme.preview.moveTree")}
            tokens={[
              "--secondary-color-2",
              "--main-font-color",
              "--secondary-color-3",
              "--bg-color2",
              "--secondary-color-3-bg",
            ]}
          >
            <div className="theme-customizer-preview__move-labels">
              <p className="historyState">{t("History")}</p>
              <p className="currentState">{t("Current")}</p>
              <p className="exploreState">{t("Explore")}</p>
            </div>
            <p className="mt-2">
              <span className="gameMoveFocus gameMoveNums">12.</span>
              {t("theme.preview.focusedMove")}
            </p>
          </PreviewCard>

          <PreviewCard
            title={t("theme.preview.notifications")}
            tokens={[
              "--secondary-color-3-bg",
              "--secondary-color-3",
              "--secondary-font-color",
            ]}
          >
            <div className="theme-customizer-preview__notification-mock">
              <span className="notification-panel-news-callout">
                {t("theme.preview.newsCallout")}
              </span>
              <div className="notification-panel-item notification-panel-item-new">
                <strong>{t("theme.preview.notificationTitle")}</strong>
                <p className="notification-panel-time">
                  {t("theme.preview.notificationTime")}
                </p>
              </div>
            </div>
          </PreviewCard>

          <PreviewCard
            title={t("theme.preview.selection")}
            tokens="--main-fg-color"
          >
            <div className="theMetaGame theme-customizer-preview__selection-box">
              {t("theme.preview.selectedGame")}
            </div>
          </PreviewCard>

          <PreviewCard
            title={t("theme.preview.tags")}
            tokens="--tag-background-color"
          >
            <div className="tags">
              <span className="tag">{t("theme.tag1")}</span>
              <span className="tag">{t("theme.tag2")}</span>
            </div>
          </PreviewCard>

          <PreviewCard
            title={t("theme.preview.boardSvg")}
            tokens={["--svg-default-fill", "--svg-volcano-caps"]}
          >
            <div className="theme-customizer-preview__svg-samples">
              <div className="theme-customizer-preview__svg-sample">
                <svg viewBox="0 0 32 32" aria-hidden="true">
                  <polygon
                    points="4,4 28,4 28,28 4,28"
                    fill="var(--svg-default-fill)"
                  />
                </svg>
                <span className="help">{t("theme.preview.svgDefaultFill")}</span>
              </div>
              <div className="theme-customizer-preview__svg-sample">
                <svg viewBox="0 0 32 32" aria-hidden="true">
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    fill="none"
                    stroke="var(--svg-volcano-caps)"
                    strokeWidth="4"
                  />
                </svg>
                <span className="help">{t("theme.preview.svgVolcanoCaps")}</span>
              </div>
            </div>
          </PreviewCard>
        </div>
      </div>
    </div>
  );
}

ThemeCustomizerPreview.propTypes = {
  previewVars: PropTypes.object.isRequired,
};

export default ThemeCustomizerPreview;
