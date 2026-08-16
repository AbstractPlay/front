import { useLocation } from "react-router-dom";
import { useGameMoveSession } from "./GameMove/useGameMoveSession";
import LayoutFeedback from "./GameMove/LayoutFeedback";
import GameMoveStripLayout from "./GameMove/layouts/GameMoveStripLayout";
import GameMoveCardLayout from "./GameMove/layouts/GameMoveCardLayout";
import GameMoveNarrativeLayout from "./GameMove/layouts/GameMoveNarrativeLayout";
import {
  LAYOUT_CARD,
  LAYOUT_NARRATIVE,
  LAYOUT_STRIP,
  MOVE_BETA_BASE,
  resolveBetaLayout,
} from "../lib/GameMove/layoutPreference";

function BetaLayout({ session, layoutId }) {
  switch (layoutId) {
    case LAYOUT_CARD:
      return <GameMoveCardLayout session={session} />;
    case LAYOUT_NARRATIVE:
      return <GameMoveNarrativeLayout session={session} />;
    case LAYOUT_STRIP:
    default:
      return <GameMoveStripLayout session={session} />;
  }
}

function GameMoveBetaShell() {
  const location = useLocation();
  const layoutId = resolveBetaLayout(location.search);
  const session = useGameMoveSession({
    routerState: location.state,
    moveBasePath: MOVE_BETA_BASE,
  });

  return (
    <div className="game-move-beta-shell">
      <BetaLayout session={session} layoutId={layoutId} />
      <LayoutFeedback layoutId={layoutId} />
    </div>
  );
}

export default GameMoveBetaShell;
