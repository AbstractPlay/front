import { useStore } from "../../../stores";
import {
  buildMoveEntryProps,
  buildMiscButtonsProps,
} from "../../../lib/GameMove/gameMoveLayoutHelpers";
import { sessionExplorationAllowed } from "../../../lib/effectiveGameFlags";
import DockMoveEntry from "./DockMoveEntry";
import DockMiscButtons from "./DockMiscButtons";

function liveMiscHasContent(miscProps, globalMe, game) {
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
  const globalMe = useStore((state) => state.globalMe);

  const moveEntryProps = buildMoveEntryProps(session, { forceUndoRight: true });
  const miscProps = buildMiscButtonsProps(session);
  const game = moveEntryProps.game;
  const showMisc = liveMiscHasContent(miscProps, globalMe, game);

  return (
    <div className="game-move-live-dock">
      <DockMoveEntry
        {...moveEntryProps}
        expanded
        pinExplorationToolbar={false}
        layoutVariant="live"
      />
      {showMisc ? <DockMiscButtons {...miscProps} /> : null}
    </div>
  );
}

export default LiveActionDock;
