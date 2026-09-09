import { useEffect, useRef, useState } from "react";
import { useStore } from "../../../stores";
import {
  buildBoardProps,
  buildMiscButtonsProps,
  buildMoveEntryProps,
  getLayoutContext,
} from "../../../lib/GameMove/gameMoveLayoutHelpers";
import GameMoveHelmetTour from "./GameMoveHelmetTour";
import GameMoveLayoutError from "./GameMoveLayoutError";
import GameMoveLayoutModals from "./GameMoveLayoutModals";
import Board from "../Board";
import CardHeader from "../preview/CardHeader";
import CardTurnBar from "../preview/CardTurnBar";
import CardMovePath from "../preview/CardMovePath";
import CardStatusSummary from "../preview/CardStatusSummary";
import RecentMovesStrip from "../preview/RecentMovesStrip";
import CardOverlayPanel from "../preview/CardOverlayPanel";
import { GameMoveChatSection } from "./GameMoveSections";

export default function GameMoveCardLayout({ session }) {
  const users = useStore((state) => state.users);
  const myMove = useStore((state) => state.myMove);
  const [highlightNextGame, setHighlightNextGame] = useState(false);
  const prevSubmitting = useRef(session.submitting);

  useEffect(() => {
    if (prevSubmitting.current && !session.submitting) {
      setHighlightNextGame(true);
      const id = window.setTimeout(() => setHighlightNextGame(false), 4000);
      prevSubmitting.current = session.submitting;
      return () => window.clearTimeout(id);
    }
    prevSubmitting.current = session.submitting;
    return undefined;
  }, [session.submitting]);

  if (session.error) {
    return <GameMoveLayoutError session={session} />;
  }

  const layoutContext = getLayoutContext(session, users, myMove, session.t);
  const { myColour } = layoutContext;
  const moveEntryProps = buildMoveEntryProps(session, { forceUndoRight: true });
  const miscProps = buildMiscButtonsProps(session);

  const boardFrameClass =
    myColour != null ? " game-move-queue-card__board--framed" : "";

  return (
    <>
      <GameMoveHelmetTour session={session} />
      <article className="game-move-layout game-move-layout--card">
        <div className="game-move-queue-card">
          <div className="game-move-queue-card__intro">
            <CardHeader
              t={session.t}
              session={session}
              layoutContext={layoutContext}
              highlightNextGame={highlightNextGame}
            />
            <CardTurnBar session={session} layoutContext={layoutContext} />
          </div>
          <div className={`game-move-queue-card__board${boardFrameClass}`}>
            <Board {...buildBoardProps(session)} />
          </div>
          <CardMovePath {...moveEntryProps} miscProps={miscProps} />
          <CardStatusSummary session={session} />
          <div className="game-move-queue-card__inline-chat">
            <GameMoveChatSection session={session} />
          </div>
          <RecentMovesStrip session={session} t={session.t} />
          <CardOverlayPanel session={session} />
        </div>
      </article>
      <GameMoveLayoutModals session={session} />
    </>
  );
}
