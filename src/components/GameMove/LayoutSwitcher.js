import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BETA_LAYOUTS,
  gameMovePath,
  layoutDescriptionKey,
  layoutLabelKey,
  writeBetaLayoutPreference,
} from "../../lib/GameMove/layoutPreference";

export default function LayoutSwitcher({ layoutId }) {
  const { t } = useTranslation();
  const { metaGame, cbits, gameID } = useParams();

  const handleLayoutClick = (toLayoutId) => {
    writeBetaLayoutPreference(toLayoutId);
  };

  return (
    <div
      className="game-move-layout-switcher"
      role="radiogroup"
      aria-label={t("gameMove.layout.switcherAria")}
    >
      <div className="game-move-layout-switcher__options">
        {BETA_LAYOUTS.map((id) => (
          <Link
            key={id}
            to={gameMovePath(metaGame, cbits, gameID, {
              beta: true,
              layout: id,
            })}
            className={`button is-small ${
              layoutId === id ? "apButton" : "apButtonNeutral"
            }`}
            role="radio"
            aria-checked={layoutId === id}
            title={t(layoutDescriptionKey(id))}
            onClick={() => handleLayoutClick(id)}
          >
            {t(layoutLabelKey(id))}
          </Link>
        ))}
      </div>
    </div>
  );
}
