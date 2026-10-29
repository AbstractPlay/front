import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { isArenaGame } from "../../lib/arena/arenaGame";
import { mergeArenaClockSync } from "../../lib/arena/applyArenaClockSync";

/**
 * Full-screen overlay while waiting for the opponent's board or the synchronized start countdown.
 */
export default function ArenaStartOverlay({ session }) {
  const { t } = useTranslation();
  const overlayGame = session?.arenaOverlayGame;
  const [, overlayTick] = useState(0);

  useEffect(() => {
    if (!overlayGame || !isArenaGame(overlayGame)) {
      return undefined;
    }
    if (overlayGame.gameOver || overlayGame.toMove === "") {
      return undefined;
    }
    const startAt = overlayGame.arenaClockStartAt;
    const waiting =
      startAt === undefined
      || startAt === null
      || Date.now() < startAt;
    if (!waiting) {
      return undefined;
    }
    const id = window.setInterval(() => {
      overlayTick((n) => n + 1);
    }, 250);
    return () => window.clearInterval(id);
  }, [
    overlayGame,
    overlayGame?.arenaClockStartAt,
    overlayGame?.gameOver,
    overlayGame?.toMove,
  ]);

  const overlay = useMemo(
    () => computeArenaStartOverlay(overlayGame, Date.now()),
    [overlayGame, overlayTick]
  );

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
    return { visible: true, kind: "waiting" };
  }
  if (liveClockNow < startAt) {
    const seconds = Math.max(1, Math.ceil((startAt - liveClockNow) / 1000));
    return { visible: true, kind: "countdown", seconds, startAt };
  }
  return null;
}
