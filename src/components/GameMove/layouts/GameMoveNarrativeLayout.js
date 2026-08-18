import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import {
  getLayoutContext,
  formatParenthetical,
  buildMiscButtonsProps,
} from "../../../lib/GameMove/gameMoveLayoutHelpers";
import GameMoveHelmetTour from "./GameMoveHelmetTour";
import GameMoveLayoutError from "./GameMoveLayoutError";
import GameMoveLayoutModals from "./GameMoveLayoutModals";
import {
  GameMoveBoardSection,
  GameMoveChatSection,
  GameMoveLastMoveBlock,
  GameMoveLogSection,
  GameMoveMoveSection,
  GameMoveMovesSection,
  GameMoveStatusSection,
} from "./GameMoveBetaSections";
import PlayerColourChip from "../preview/PlayerColourChip";
import QueueNavButtons from "../preview/QueueNavButtons";
import DockMiscButtons from "../preview/DockMiscButtons";

export default function GameMoveNarrativeLayout({ session }) {
  const { t } = useTranslation();
  const users = useStore((state) => state.users);
  const myMove = useStore((state) => state.myMove);
  const [showHistory, setShowHistory] = useState(false);
  const [showLog, setShowLog] = useState(false);

  if (session.error) {
    return <GameMoveLayoutError session={session} />;
  }

  const layoutContext = getLayoutContext(session, users, myMove, t);
  const { gameName, parenthetical, queueCount, myColourLabel, myColour } =
    layoutContext;
  const { handleNextGame, game, metaGame } = session;

  return (
    <>
      <GameMoveHelmetTour session={session} />
      <article className="game-move-beta game-move-beta--narrative">
        <div className="game-move-beta--narrative__story">
          <header className="game-move-narrative-header">
            <h1 className="title is-5">
              <Link to={`/games/${metaGame}`}>{gameName}</Link>
            </h1>
            {parenthetical.length > 0 ? (
              <p className="game-move-narrative-header__meta">
                {formatParenthetical(parenthetical)}
              </p>
            ) : null}
            {myColourLabel ? (
              <PlayerColourChip
                colour={myColour}
                label={myColourLabel}
                className="game-move-narrative-header__colour"
              />
            ) : null}
            {queueCount > 0 ? (
              <p>{t("gameMove.layout.queueWaiting", { count: queueCount })}</p>
            ) : null}
            {game ? (
              <QueueNavButtons
                t={t}
                waitingCount={queueCount}
                onNextGame={handleNextGame}
              />
            ) : null}
          </header>
          <GameMoveLastMoveBlock layoutContext={layoutContext} t={t} />
          <GameMoveMoveSection
            session={session}
            forceUndoRight
            showMiscButtons={false}
          />
          <DockMiscButtons {...buildMiscButtonsProps(session)} />
          <GameMoveStatusSection session={session} />
          <div className="game-move-narrative-collapsible">
            <button
              type="button"
              className="button is-small apButtonNeutral"
              aria-expanded={showHistory}
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory
                ? t("gameMove.layout.hideMoves")
                : t("gameMove.layout.showMoves")}
            </button>
            {showHistory ? <GameMoveMovesSection session={session} /> : null}
          </div>
          <GameMoveChatSection session={session} />
          <div className="game-move-narrative-collapsible">
            <button
              type="button"
              className="button is-small apButtonNeutral"
              aria-expanded={showLog}
              onClick={() => setShowLog((v) => !v)}
            >
              {showLog
                ? t("gameMove.layout.hideEventLog")
                : t("gameMove.layout.showEventLog")}
            </button>
            {showLog ? <GameMoveLogSection session={session} /> : null}
          </div>
        </div>
        <div className="game-move-beta--narrative__board">
          <GameMoveBoardSection session={session} hideTitle />
        </div>
      </article>
      <GameMoveLayoutModals session={session} />
    </>
  );
}
