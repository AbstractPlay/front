import { Link } from "react-router-dom";
import { formatParenthetical } from "../../../lib/GameMove/gameMoveLayoutHelpers";
import PlayerColourChip from "./PlayerColourChip";
import QueueNavButtons from "./QueueNavButtons";

function CardHeader({ t, session, layoutContext, highlightNextGame = false }) {
  const { metaGame, handleNextGame } = session;
  const {
    gameName,
    parenthetical,
    queueCount,
    lastMoveNotation,
    lastMovePlayerName,
    myColourLabel,
    myColour,
  } = layoutContext;

  const lastMoveLine =
    lastMoveNotation && lastMovePlayerName
      ? t("gameMove.layout.lastMoveBy", {
          player: lastMovePlayerName,
          move: lastMoveNotation,
        })
      : lastMoveNotation
      ? t("gameMove.layout.lastMove", { move: lastMoveNotation })
      : null;

  return (
    <header className="game-move-queue-card__header">
      <div className="game-move-queue-card__header-top">
        <div className="game-move-queue-card__title-block">
          <h1 className="game-move-queue-card__title">
            <Link to={`/games/${metaGame}`}>{gameName}</Link>
          </h1>
          {parenthetical.length > 0 ? (
            <p className="game-move-queue-card__meta">
              {formatParenthetical(parenthetical)}
            </p>
          ) : null}
          {lastMoveLine ? (
            <p className="game-move-queue-card__last-move">{lastMoveLine}</p>
          ) : null}
        </div>
        <div
          className={`game-move-queue-card__queue-nav${
            highlightNextGame ? " is-highlighted" : ""
          }`}
        >
          <QueueNavButtons
            t={t}
            waitingCount={queueCount}
            onNextGame={handleNextGame}
          />
        </div>
      </div>
      <div className="game-move-queue-card__header-meta">
        {myColourLabel ? (
          <PlayerColourChip colour={myColour} label={myColourLabel} />
        ) : null}
        {queueCount > 0 ? (
          <span className="game-move-queue-card__queue-count">
            {t("gameMove.layout.queueWaiting", { count: queueCount })}
          </span>
        ) : null}
      </div>
    </header>
  );
}

export default CardHeader;
