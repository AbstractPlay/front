import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import {
  getLayoutContext,
  hasStatusContent,
} from "../../../lib/GameMove/gameMoveLayoutHelpers";

const STRIP_WIDE_BREAKPOINT = 900;

function stripDrawerDefaults(session) {
  const isWide = (session.screenWidth ?? STRIP_WIDE_BREAKPOINT) >= STRIP_WIDE_BREAKPOINT;
  const defaultTab = hasStatusContent(session) ? "status" : "moves";
  return {
    defaultTab,
    defaultOpen: isWide,
  };
}
import GameMoveHelmetTour from "./GameMoveHelmetTour";
import GameMoveLayoutError from "./GameMoveLayoutError";
import GameMoveLayoutModals from "./GameMoveLayoutModals";
import {
  GameMoveBetaDrawer,
  GameMoveBoardSection,
} from "./GameMoveBetaSections";
import StripContextStrip from "../preview/StripContextStrip";
import StripDock from "../preview/StripDock";

export default function GameMoveStripLayout({ session }) {
  const { t } = useTranslation();
  const users = useStore((state) => state.users);
  const myMove = useStore((state) => state.myMove);

  if (session.error) {
    return <GameMoveLayoutError session={session} />;
  }

  const layoutContext = getLayoutContext(session, users, myMove, t);
  const drawerDefaults = stripDrawerDefaults(session);

  return (
    <>
      <GameMoveHelmetTour session={session} />
      <article className="game-move-beta game-move-beta--strip">
        <StripContextStrip session={session} layoutContext={layoutContext} />
        <div className="game-move-beta--strip__main">
          <GameMoveBoardSection session={session} hideTitle />
        </div>
        <div className="game-move-beta--strip__sidebar">
          <StripDock session={session} />
          <GameMoveBetaDrawer session={session} {...drawerDefaults} />
        </div>
      </article>
      <GameMoveLayoutModals session={session} />
    </>
  );
}
