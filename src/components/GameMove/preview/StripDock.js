import { useEffect, useState } from "react";
import {
  buildMoveEntryProps,
  buildMiscButtonsProps,
} from "../../../lib/GameMove/gameMoveLayoutHelpers";
import DockMoveEntry from "./DockMoveEntry";
import DockMiscButtons from "./DockMiscButtons";

function StripDock({ session }) {
  const { t } = session;
  const screenWidth = session.screenWidth ?? 1024;
  const isNarrow = screenWidth < 900;
  const [expanded, setExpanded] = useState(!isNarrow);

  useEffect(() => {
    if (!isNarrow) {
      setExpanded(true);
    }
  }, [isNarrow]);

  const moveEntryProps = buildMoveEntryProps(session, { forceUndoRight: true });
  const miscProps = buildMiscButtonsProps(session);

  return (
    <div
      className={`game-move-beta--strip__dock game-move-strip-dock${
        expanded ? " is-expanded" : ""
      }`}
    >
      <div className="game-move-strip-dock__bar">
        <DockMoveEntry {...moveEntryProps} expanded={expanded} />
        {isNarrow ? (
          <button
            type="button"
            className="button is-small apButtonNeutral game-move-strip-dock__toggle"
            aria-expanded={expanded}
            aria-controls="game-move-strip-dock-details"
            onClick={() => setExpanded((v) => !v)}
          >
            <span className="icon" aria-hidden="true">
              <i className={`fa fa-chevron-${expanded ? "up" : "down"}`} />
            </span>
            <span>
              {expanded
                ? t("gameMove.layout.dockCollapse")
                : t("gameMove.layout.dockExpand")}
            </span>
          </button>
        ) : null}
      </div>
      {expanded ? (
        <div
          id="game-move-strip-dock-details"
          className="game-move-strip-dock__details"
        >
          <DockMiscButtons {...miscProps} />
        </div>
      ) : null}
    </div>
  );
}

export default StripDock;
