import { useEffect, useState } from "react";
import { useStore } from "../../../stores";
import { getPlayerClockChips } from "./moveEntryUtils";

function CardTurnBar({ session, layoutContext }) {
  const { toMove, game } = session;
  const users = useStore((state) => state.users);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!game || toMove === "") return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [game, toMove]);

  if (!game || toMove === "") {
    return null;
  }

  const chips = getPlayerClockChips(game, toMove, users, now);
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
            layoutContext.isMyTurn ? " game-move-queue-card__turn--mine" : ""
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
            <span className="game-move-queue-card__clock-name">{chip.label}</span>
            <span className="game-move-queue-card__clock-time">{chip.time}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default CardTurnBar;
