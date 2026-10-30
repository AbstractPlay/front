import { useEffect, useState } from "react";
import { useStore } from "../../../stores";
import { getLivePlayerClockChips, isPlayerIndexOnMove } from "./moveEntryUtils";
import PlayerOnlineIcon from "./PlayerOnlineIcon";
import PlayerVacationPauseIcon from "./PlayerVacationPauseIcon";

function LiveClockPanel({ session, variant = "sidebar" }) {
  const { t, game, liveClockTicking, liveClockNow } = session;
  const liveToMove = game?.toMove ?? "";
  const users = useStore((state) => state.users);
  const [localNow, setLocalNow] = useState(() => Date.now());

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

  if (clockChips.length === 0) {
    return null;
  }

  const activeChip = clockChips.find((c) => c.active);

  return (
    <section
      className={`game-move-live-clocks game-move-live-clocks--${variant}`}
      aria-label={t("gameMove.layout.liveClocksAria")}
    >
      {activeChip && game ? (
        <p
          className={`game-move-live-context__turn${
            game.canSubmit && isPlayerIndexOnMove(game.me, liveToMove)
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
    </section>
  );
}

export default LiveClockPanel;
