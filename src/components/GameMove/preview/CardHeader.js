import { Link } from "react-router-dom";
import { formatParenthetical } from "../../../lib/GameMove/gameMoveLayoutHelpers";
import PlayerColourChip from "./PlayerColourChip";
import QueueNavButtons from "./QueueNavButtons";
import LastMoveChip from "./LastMoveChip";
import LayoutPickerTrigger from "../LayoutPickerTrigger";

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
          {lastMoveNotation ? (
            <p className="game-move-queue-card__last-move">
              <LastMoveChip
                t={t}
                lastMoveNotation={lastMoveNotation}
                lastMovePlayerName={lastMovePlayerName}
              />
            </p>
          ) : null}
        </div>
        <div
          className={`game-move-queue-card__queue-nav${
            highlightNextGame ? " is-highlighted" : ""
          }`}
        >
          <LayoutPickerTrigger
            compact={(session.screenWidth ?? 1024) <= 768}
          />
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
