import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_BETA_LAYOUT,
  gameMovePath,
} from "../../lib/GameMove/layoutPreference";

function LayoutExperimentBanner({ onDismiss }) {
  const { t } = useTranslation();
  const { metaGame, cbits, gameID } = useParams();
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return null;
  }

  const betaHref = gameMovePath(metaGame, cbits, gameID, {
    beta: true,
    layout: DEFAULT_BETA_LAYOUT,
  });

  const handleDismiss = () => {
    onDismiss?.();
    setHidden(true);
  };

  return (
    <div
      className="notification is-info is-light game-move-experiment-banner"
      role="region"
      aria-label={t("gameMove.layout.bannerAria")}
    >
      <button
        type="button"
        className="delete"
        aria-label={t("gameMove.layout.bannerDismiss")}
        onClick={handleDismiss}
      />
      <p>
        <strong>{t("gameMove.layout.bannerTitle")}</strong>{" "}
        {t("gameMove.layout.bannerBody")}
      </p>
      <p className="game-move-experiment-banner__actions">
        <Link className="button is-small apButton" to={betaHref}>
          {t("gameMove.layout.bannerTry")}
        </Link>
      </p>
    </div>
  );
}

export default LayoutExperimentBanner;
