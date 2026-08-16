import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import { getLayoutContext } from "../../../lib/GameMove/gameMoveLayoutHelpers";
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

  return (
    <>
      <GameMoveHelmetTour session={session} />
      <article className="game-move-beta game-move-beta--strip">
        <StripContextStrip session={session} layoutContext={layoutContext} />
        <div className="game-move-beta--strip__main">
          <GameMoveBoardSection session={session} hideTitle />
        </div>
        <StripDock session={session} />
        <GameMoveBetaDrawer session={session} defaultTab="moves" />
      </article>
      <GameMoveLayoutModals session={session} />
    </>
  );
}
