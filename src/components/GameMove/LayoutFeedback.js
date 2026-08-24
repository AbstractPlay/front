import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  gameMovePath,
  layoutLabelKey,
} from "../../lib/GameMove/layoutPreference";
import LayoutSwitcher from "./LayoutSwitcher";

const MOBILE_PANEL_MAX_WIDTH = 768;

function useMobilePanelExpanded() {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth > MOBILE_PANEL_MAX_WIDTH;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_PANEL_MAX_WIDTH}px)`);
    const onChange = (event) => {
      if (!event.matches) {
        setExpanded(true);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return [expanded, setExpanded];
}

function LayoutFeedback({ layoutId }) {
  const { t } = useTranslation();
  const { metaGame, cbits, gameID } = useParams();
  const [expanded, setExpanded] = useMobilePanelExpanded();

  const classicHref = gameMovePath(metaGame, cbits, gameID, { beta: false });
  const layoutName = t(layoutLabelKey(layoutId));
  const layoutTitle = `${t("gameMove.layout.switchLayout")}: ${layoutName}`;

  return (
    <aside
      className={`game-move-layout-feedback${
        expanded ? " is-expanded" : " is-collapsed"
      }`}
      aria-label={t("gameMove.layout.switcherAria")}
    >
      <div className="game-move-layout-feedback__panel">
        <p className="game-move-layout-feedback__title">{layoutTitle}</p>
        <button
          type="button"
          className="game-move-layout-feedback__toggle"
          aria-expanded={expanded}
          aria-controls="game-move-layout-feedback-body"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="game-move-layout-feedback__toggle-label">
            {layoutTitle}
          </span>
          <span className="icon game-move-layout-feedback__toggle-icon" aria-hidden="true">
            <i className={`fa fa-chevron-${expanded ? "down" : "up"}`} />
          </span>
          <span className="game-move-layout-feedback__toggle-hint">
            {expanded
              ? t("gameMove.layout.feedbackCollapse")
              : t("gameMove.layout.feedbackExpand")}
          </span>
        </button>
        <div
          id="game-move-layout-feedback-body"
          className="game-move-layout-feedback__body"
        >
          <LayoutSwitcher layoutId={layoutId} />
          <Link className="button is-small apButtonNeutral" to={classicHref}>
            {t("gameMove.layout.backToClassic")}
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default LayoutFeedback;
