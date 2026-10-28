import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGameMoveLayout } from "../../hooks/useGameMoveLayout";
import {
  ALL_LAYOUTS,
  gameMovePath,
  layoutDescriptionKey,
  layoutLabelKey,
  PLAY_CONTEXT_LIVE,
  readLayoutPreference,
  writeLayoutPreference,
} from "../../lib/GameMove/layoutPreference";
import { trackLayoutSwitch } from "../../lib/GameMove/layoutTracking";
import { ARENA_MOVE_BASE, ARENA_WATCH_BASE } from "../../lib/arena/arenaMoveBase";

function moveBasePathForContext(playContext, pathname = "") {
  if (playContext === PLAY_CONTEXT_LIVE) {
    if (pathname.includes("/arena/watch/")) {
      return ARENA_WATCH_BASE;
    }
    return ARENA_MOVE_BASE;
  }
  return undefined;
}

export default function LayoutSwitcher({
  layoutId,
  variant = "inline",
  onSelect,
}) {
  const { t } = useTranslation();
  const { metaGame, cbits, gameID } = useParams();
  const { resolvedFrom, playContext } = useGameMoveLayout();
  const { pathname } = useLocation();
  const basePath = moveBasePathForContext(playContext, pathname);

  const handleLayoutClick = (toLayoutId) => {
    if (toLayoutId !== layoutId) {
      trackLayoutSwitch({
        from: layoutId,
        to: toLayoutId,
        resolvedFrom,
        metaGame,
        storedLayout: readLayoutPreference(playContext),
      });
    }
    writeLayoutPreference(toLayoutId, playContext);
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
            to={gameMovePath(metaGame, cbits, gameID, {
              layout: id,
              basePath,
            })}
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
