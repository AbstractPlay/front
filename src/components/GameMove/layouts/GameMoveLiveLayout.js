import { useStore } from "../../../stores";
import { getLayoutContext } from "../../../lib/GameMove/gameMoveLayoutHelpers";
import GameMoveHelmetTour from "./GameMoveHelmetTour";
import GameMoveLayoutError from "./GameMoveLayoutError";
import GameMoveLayoutModals from "./GameMoveLayoutModals";
import { GameMoveBoardSection, GameMoveDrawer } from "./GameMoveSections";
import LiveContextBar from "../preview/LiveContextBar";
import LiveActionDock from "../preview/LiveActionDock";

export default function GameMoveLiveLayout({ session }) {
  const users = useStore((state) => state.users);
  const myMove = useStore((state) => state.myMove);

  if (session.error) {
    return <GameMoveLayoutError session={session} />;
  }

  const layoutContext = getLayoutContext(session, users, myMove, session.t);

  return (
    <>
      <GameMoveHelmetTour session={session} />
      <article className="game-move-layout game-move-layout--live">
        <LiveContextBar session={session} layoutContext={layoutContext} />
        <div className="game-move-layout--live__main">
          <GameMoveBoardSection session={session} hideTitle />
        </div>
        <div className="game-move-layout--live__sidebar">
          <LiveActionDock session={session} />
          <GameMoveDrawer
            key={session.game?.id ?? session.gameID}
            session={session}
            defaultTab="status"
            defaultOpen
          />
        </div>
      </article>
      <GameMoveLayoutModals session={session} />
    </>
  );
}
