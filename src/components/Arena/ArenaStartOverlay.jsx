import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { computeArenaStartOverlay } from "./ArenaStartOverlay.logic";

/**
 * Full-screen overlay while waiting for the opponent's board or the synchronized start countdown.
 */
export default function ArenaStartOverlay({ session }) {
  const { t } = useTranslation();
  const overlayGame = session?.arenaOverlayGame;
  const liveClockNow = session?.liveClockNow ?? Date.now();

  const overlay = useMemo(
    () => computeArenaStartOverlay(overlayGame, liveClockNow),
    [overlayGame, liveClockNow]
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

export { computeArenaStartOverlay } from "./ArenaStartOverlay.logic";
