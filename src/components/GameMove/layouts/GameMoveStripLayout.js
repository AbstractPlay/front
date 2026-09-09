import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import { getLayoutContext } from "../../../lib/GameMove/gameMoveLayoutHelpers";
import GameMoveHelmetTour from "./GameMoveHelmetTour";
import GameMoveLayoutError from "./GameMoveLayoutError";
import GameMoveLayoutModals from "./GameMoveLayoutModals";
import { GameMoveBoardSection, GameMoveDrawer } from "./GameMoveSections";
import StripContextStrip from "../preview/StripContextStrip";
import StripDock from "../preview/StripDock";
import LayoutHint from "../LayoutHint";

const STRIP_WIDE_BREAKPOINT = 900;

function stripDrawerDefaults(session) {
  const isWide =
    (session.screenWidth ?? STRIP_WIDE_BREAKPOINT) >= STRIP_WIDE_BREAKPOINT;
  return {
    defaultTab: "status",
    defaultOpen: isWide,
  };
}

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
      <article className="game-move-layout game-move-layout--strip">
        <LayoutHint />
        <StripContextStrip session={session} layoutContext={layoutContext} />
        <div className="game-move-layout--strip__main">
          <GameMoveBoardSection session={session} hideTitle />
        </div>
        <div className="game-move-layout--strip__sidebar">
          <StripDock session={session} />
          <GameMoveDrawer
            key={session.game?.id ?? session.gameID}
            session={session}
            {...drawerDefaults}
          />
        </div>
      </article>
      <GameMoveLayoutModals session={session} />
    </>
  );
}
