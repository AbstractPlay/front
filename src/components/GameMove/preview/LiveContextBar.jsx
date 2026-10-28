import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../../stores";
import { isArenaGame } from "../../../lib/arena/arenaGame";
import { getLivePlayerClockChips, isPlayerIndexOnMove } from "./moveEntryUtils";
import PlayerColourChip from "./PlayerColourChip";
import LastMoveChip from "./LastMoveChip";
import LayoutPickerTrigger from "../LayoutPickerTrigger";
import PlayerOnlineIcon from "./PlayerOnlineIcon";
import PlayerVacationPauseIcon from "./PlayerVacationPauseIcon";

const MOBILE_PANEL_MAX_WIDTH = 768;

function LiveContextBar({ session, layoutContext }) {
  const { t, game, metaGame, liveClockTicking, liveClockNow } = session;
  const liveToMove = game?.toMove ?? "";
  const users = useStore((state) => state.users);
  const [localNow, setLocalNow] = useState(() => Date.now());
  const compact =
    (session.screenWidth ?? MOBILE_PANEL_MAX_WIDTH) <= MOBILE_PANEL_MAX_WIDTH;
  const arena = isArenaGame(game);

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

  const now = liveClockTicking ? liveClockNow : localNow;

  const clockChips =
    game && liveToMove !== ""
      ? getLivePlayerClockChips(game, users, now)
      : [];

  useEffect(() => {
    if (liveClockTicking || !game || liveToMove === "") {
      return undefined;
    }
    const id = window.setInterval(() => setLocalNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [game, liveClockTicking, liveToMove]);

  const activeChip = clockChips.find((c) => c.active);

  return (
    <header className="game-move-live-context">
      <div className="game-move-live-context__meta">
        <div className="game-move-live-context__title-row">
          <span className="game-move-live-context__game">
            <strong>
              <Link to={`/games/${metaGame}`}>{gameName}</Link>
            </strong>
            {parenthetical.length === 0 ? null : (
              <span className="game-move-live-context__parenthetical">
                {" "}
                ({parenthetical.reduce((a, b) => [a, ", ", b])})
              </span>
            )}
          </span>
          <LayoutPickerTrigger compact={compact} />
        </div>
        <div className="game-move-live-context__chips">
          {myColourLabel ? (
            <PlayerColourChip colour={myColour} label={myColourLabel} />
          ) : null}
          {!arena && queueCount > 0 ? (
            <span className="game-move-live-context__chip">
              {t("gameMove.layout.queueWaiting", { count: queueCount })}
            </span>
          ) : null}
          <span className="game-move-live-context__chip">
            {t("gameMove.layout.movePly", { n: moveNumber })}
          </span>
          {lastMoveNotation ? (
            <LastMoveChip
              t={t}
              lastMoveNotation={lastMoveNotation}
              lastMovePlayerName={lastMovePlayerName}
            />
          ) : null}
        </div>
      </div>
      {clockChips.length > 0 ? (
        <div className="game-move-live-context__clocks">
          {activeChip && game ? (
            <p
              className={`game-move-live-context__turn${
                game.canSubmit &&
                isPlayerIndexOnMove(game.me, liveToMove)
                  ? " game-move-live-context__turn--mine"
                  : ""
              }`}
            >
              {t("ToMove", { player: activeChip.label })}
            </p>
          ) : null}
          <div className="game-move-live-context__clock-row" role="list">
            {clockChips.map((chip) => (
              <span
                key={chip.key}
                role="listitem"
                className={`game-move-live-context__clock${
                  chip.active ? " is-active" : ""
                }`}
              >
                <span className="game-move-live-context__clock-name">
                  {chip.label}
                  <PlayerOnlineIcon
                    playerId={chip.playerId}
                    className="game-move-player-online--chip"
                  />
                </span>
                <span className="game-move-live-context__clock-time">
                  {chip.clockPaused && chip.active
                    ? `${chip.time} · ${t("ClockPaused")}`
                    : chip.time}
                  {chip.onVacation ? (
                    <PlayerVacationPauseIcon className="game-move-player-vacation-pause--chip" />
                  ) : null}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default LiveContextBar;
