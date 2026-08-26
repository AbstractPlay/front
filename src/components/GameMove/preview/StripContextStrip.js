import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../../stores";
import { getPlayerClockChips } from "./moveEntryUtils";
import PlayerColourChip from "./PlayerColourChip";
import QueueNavButtons from "./QueueNavButtons";

function StripContextStrip({ session, layoutContext }) {
  const { t, handleNextGame, game, toMove, metaGame } = session;
  const users = useStore((state) => state.users);
  const [now, setNow] = useState(Date.now());

  const {
    gameName,
    parenthetical,
    queueCount,
    lastMoveNotation,
    lastMovePlayerName,
    myColourLabel,
    myColour,
    moveNumber,
  } = layoutContext;

  const clockChips =
    uiStateActive(game, toMove) && game
      ? getPlayerClockChips(game, toMove, users, now)
      : [];

  useEffect(() => {
    if (!game || toMove === "") return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [game, toMove]);

  return (
    <header className="game-move-context-strip game-move-strip-context">
      <div className="game-move-context-strip__primary">
        <span className="game-move-context-strip__game">
          <strong>
            <Link to={`/games/${metaGame}`}>{gameName}</Link>
          </strong>
          {parenthetical.length === 0 ? null : (
            <span className="game-move-context-strip__meta">
              {" "}
              ({parenthetical.reduce((a, b) => [a, ", ", b])})
            </span>
          )}
        </span>
        {myColourLabel ? (
          <PlayerColourChip colour={myColour} label={myColourLabel} />
        ) : null}
        {queueCount > 0 ? (
          <span className="game-move-context-strip__chip">
            {t("gameMove.layout.queueWaiting", { count: queueCount })}
          </span>
        ) : null}
        <span className="game-move-context-strip__chip">
          {t("gameMove.layout.movePly", { n: moveNumber })}
        </span>
        {clockChips.map((chip) => (
          <span
            key={chip.key}
            className={`game-move-context-strip__chip game-move-context-strip__chip--clock${
              chip.active ? " is-active" : ""
            }`}
            title={chip.label}
          >
            <span className="game-move-strip-context__clock-name">
              {chip.label}
            </span>
            <span className="game-move-strip-context__clock-time">
              {chip.time}
            </span>
          </span>
        ))}
      </div>
      <div className="game-move-context-strip__secondary">
        {lastMoveNotation ? (
          <span className="game-move-context-strip__last-move">
            {lastMovePlayerName
              ? t("gameMove.layout.lastMoveBy", {
                  player: lastMovePlayerName,
                  move: lastMoveNotation,
                })
              : t("gameMove.layout.lastMove", { move: lastMoveNotation })}
          </span>
        ) : null}
        {game ? (
          <QueueNavButtons
            t={t}
            waitingCount={queueCount}
            onNextGame={handleNextGame}
          />
        ) : null}
      </div>
    </header>
  );
}

function uiStateActive(game, toMove) {
  return Boolean(game && toMove !== "");
}

export default StripContextStrip;
