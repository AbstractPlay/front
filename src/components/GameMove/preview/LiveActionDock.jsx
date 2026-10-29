import { useState } from "react";
import { useStore } from "../../../stores";
import {
  buildMoveEntryProps,
  buildMiscButtonsProps,
} from "../../../lib/GameMove/gameMoveLayoutHelpers";
import { sessionExplorationAllowed } from "../../../lib/effectiveGameFlags";
import DockMoveEntry from "./DockMoveEntry";
import DockMiscButtons from "./DockMiscButtons";

function liveMorePanelHasContent(miscProps, globalMe, game) {
  if (!game) {
    return false;
  }
  const canShowExplore =
    globalMe?.settings?.all?.exploration !== -1 &&
    globalMe?.settings?.all?.exploration !== 1 &&
    !miscProps.explorer &&
    sessionExplorationAllowed(game);
  const canPublish = miscProps.canPublish !== "no";
  const canDownload =
    miscProps.toMove === "" && miscProps.gameRec !== undefined;
  return canShowExplore || canPublish || canDownload;
}

function LiveActionDock({ session }) {
  const { t } = session;
  const globalMe = useStore((state) => state.globalMe);
  const [moreOpen, moreOpenSetter] = useState(false);

  const moveEntryProps = buildMoveEntryProps(session, { forceUndoRight: true });
  const miscProps = buildMiscButtonsProps(session);
  const game = moveEntryProps.game;
  const showMisc = liveMorePanelHasContent(miscProps, globalMe, game);

  return (
    <div className="game-move-live-dock">
      <DockMoveEntry
        {...moveEntryProps}
        expanded={false}
        primaryOnly
        pinExplorationToolbar={false}
        layoutVariant="live"
      />
      <div className="game-move-live-dock__more">
        <button
          type="button"
          className="button is-small apButtonNeutral game-move-live-dock__more-toggle"
          aria-expanded={moreOpen}
          onClick={() => moreOpenSetter((v) => !v)}
        >
          {t("gameMove.layout.moreActions")}
          <span className="icon is-small" aria-hidden="true">
            <i className={`fa fa-chevron-${moreOpen ? "up" : "down"}`} />
          </span>
        </button>
        {moreOpen ? (
          <div className="game-move-live-dock__more-panel">
            <DockMoveEntry
              {...moveEntryProps}
              extrasOnly
              pinExplorationToolbar={false}
              layoutVariant="live"
            />
            {showMisc ? <DockMiscButtons {...miscProps} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default LiveActionDock;
