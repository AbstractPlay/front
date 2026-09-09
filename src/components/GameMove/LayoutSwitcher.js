import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGameMoveLayout } from "../../hooks/useGameMoveLayout";
import {
  ALL_LAYOUTS,
  gameMovePath,
  layoutDescriptionKey,
  layoutLabelKey,
  readLayoutPreference,
  writeLayoutPreference,
} from "../../lib/GameMove/layoutPreference";
import { trackLayoutSwitch } from "../../lib/GameMove/layoutTracking";

export default function LayoutSwitcher({
  layoutId,
  variant = "inline",
  onSelect,
}) {
  const { t } = useTranslation();
  const { metaGame, cbits, gameID } = useParams();
  const { resolvedFrom } = useGameMoveLayout();

  const handleLayoutClick = (toLayoutId) => {
    if (toLayoutId !== layoutId) {
      trackLayoutSwitch({
        from: layoutId,
        to: toLayoutId,
        resolvedFrom,
        metaGame,
        storedLayout: readLayoutPreference(),
      });
    }
    writeLayoutPreference(toLayoutId);
    onSelect?.();
  };

  return (
    <div
      className={`game-move-layout-switcher${
        variant === "modal" ? " game-move-layout-switcher--modal" : ""
      }`}
      role="radiogroup"
      aria-label={t("gameMove.layout.switcherAria")}
    >
      <div className="game-move-layout-switcher__options">
        {ALL_LAYOUTS.map((id) => (
          <Link
            key={id}
            to={gameMovePath(metaGame, cbits, gameID, { layout: id })}
            className={`button is-small ${
              layoutId === id ? "apButton" : "apButtonNeutral"
            }${variant === "modal" ? " game-move-layout-switcher__option" : ""}`}
            role="radio"
            aria-checked={layoutId === id}
            title={t(layoutDescriptionKey(id))}
            onClick={() => handleLayoutClick(id)}
          >
            <span className="game-move-layout-switcher__name">
              {t(layoutLabelKey(id))}
            </span>
            {variant === "modal" ? (
              <span className="game-move-layout-switcher__description">
                {t(layoutDescriptionKey(id))}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
