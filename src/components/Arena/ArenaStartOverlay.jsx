import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { isArenaGame } from "../../lib/arena/arenaGame";

/**
 * Full-screen overlay while waiting for the opponent's board or the synchronized start countdown.
 */
export default function ArenaStartOverlay({ session }) {
  const { t } = useTranslation();
  const overlay = session?.arenaStartOverlay;

  const label = useMemo(() => {
    if (!overlay) {
      return "";
    }
    if (overlay.kind === "waiting") {
      return t("Arena.start.waitingOpponent");
    }
    if (overlay.kind === "countdown") {
      return t("Arena.start.countdown", { count: overlay.seconds });
    }
    return "";
  }, [overlay, t]);

  if (!overlay?.visible || !label) {
    return null;
  }

  return (
    <div
      className="arena-start-overlay"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="arena-start-overlay__card">
        <p className="arena-start-overlay__title">{label}</p>
        {overlay.kind === "countdown" ? (
          <p className="arena-start-overlay__sub">{t("Arena.start.countdownHint")}</p>
        ) : null}
      </div>
    </div>
  );
}

export function computeArenaStartOverlay(dbgame, liveClockNow) {
  if (!dbgame || !isArenaGame(dbgame) || dbgame.gameOver || dbgame.toMove === "") {
    return null;
  }
  const startAt = dbgame.arenaClockStartAt;
  if (startAt === undefined || startAt === null) {
    const readyCount = Array.isArray(dbgame.arenaPlayReady)
      ? dbgame.arenaPlayReady.length
      : 0;
    const need = dbgame.numPlayers ?? 2;
    if (readyCount < need) {
      return { visible: true, kind: "waiting" };
    }
    return { visible: true, kind: "waiting" };
  }
  if (liveClockNow < startAt) {
    const seconds = Math.max(1, Math.ceil((startAt - liveClockNow) / 1000));
    return { visible: true, kind: "countdown", seconds, startAt };
  }
  return null;
}
