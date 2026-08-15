import React from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { STATS_MODULES } from "../../lib/statsSections";
import CopyDeepLinkButton from "./CopyDeepLinkButton";

function StatsModule({
  code,
  Component,
  componentProps,
  pinned,
  onTogglePin,
  showPin,
  tabId,
}) {
  const { t } = useTranslation();
  const config = STATS_MODULES[code];
  const widthTier = config?.width ?? "full";
  const columnClass =
    widthTier === "half" ? "column is-12 is-6-desktop" : "column is-12";
  const showExplanation =
    code !== "siteStats" && config?.explanationKey !== undefined;
  const statsPath = tabId !== undefined ? `/stats/${tabId}` : undefined;

  return (
    <div className={columnClass}>
      <div id={`stats-${code}`} className="card stats-module">
        <header className="card-header">
          <p className="card-header-title">
            {t(config?.nameKey ?? `stats_module_${code}`)}
          </p>
          <CopyDeepLinkButton
            hash={`#stats-${code}`}
            pathname={statsPath}
          />
          {showPin ? (
            <button
              type="button"
              className={`card-header-icon${pinned ? " has-text-warning" : ""}`}
              aria-label={pinned ? t("player.pin.remove") : t("player.pin.add")}
              title={pinned ? t("player.pin.remove") : t("player.pin.add")}
              onClick={() => onTogglePin(code)}
            >
              <span className="icon">
                <i className="fa fa-thumb-tack" aria-hidden="true"></i>
              </span>
            </button>
          ) : null}
        </header>
        <div className="card-content">
          {showExplanation ? (
            <div className="stats-module-explanation content is-size-7">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {t(config.explanationKey)}
              </ReactMarkdown>
            </div>
          ) : null}
          <Component {...componentProps} />
        </div>
      </div>
    </div>
  );
}

export default StatsModule;
