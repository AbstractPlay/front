import { useEffect, useState } from "react";
import { useStore } from "../../../stores";
import { getLivePlayerClockChips } from "./moveEntryUtils";
import PlayerOnlineIcon from "./PlayerOnlineIcon";

function CardTurnBar({ session }) {
  const { game } = session;
  const users = useStore((state) => state.users);
  const [now, setNow] = useState(Date.now());
  const liveToMove = game?.toMove ?? "";

  useEffect(() => {
    if (!game || liveToMove === "") return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [game, liveToMove]);

  if (!game || liveToMove === "") {
    return null;
  }

  const chips = getLivePlayerClockChips(game, users, now);
  if (chips.length === 0) {
    return null;
  }

  const activeChip = chips.find((c) => c.active);
  const { t } = session;

  return (
    <div className="game-move-queue-card__turn-bar">
      {activeChip ? (
        <p
          className={`game-move-queue-card__turn${
            game.canSubmit && game.me === liveToMove
              ? " game-move-queue-card__turn--mine"
              : ""
          }`}
        >
          {t("ToMove", { player: activeChip.label })}
        </p>
      ) : null}
      <div className="game-move-queue-card__clocks" role="list">
        {chips.map((chip) => (
          <span
            key={chip.key}
            role="listitem"
            className={`game-move-queue-card__clock${
              chip.active ? " is-active" : ""
            }`}
          >
            <span className="game-move-queue-card__clock-name">
              {chip.label}
              <PlayerOnlineIcon
                playerId={chip.playerId}
                className="game-move-player-online--chip"
              />
            </span>
            <span className="game-move-queue-card__clock-time">
              {chip.time}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default CardTurnBar;
