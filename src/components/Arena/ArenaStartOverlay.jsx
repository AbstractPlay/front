import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { computeArenaStartOverlay } from "./ArenaStartOverlay.logic";
import { canAbortArenaLaunchSyncAsPlayer } from "../../lib/arena/arenaLaunchSync";
import ArenaLaunchSyncAbort from "./ArenaLaunchSyncAbort";

/**
 * Full-screen overlay while waiting for the opponent's board or the synchronized start countdown.
 */
export default function ArenaStartOverlay({ session }) {
  const { t } = useTranslation();
  const overlayGame = session?.arenaOverlayGame;
  const liveClockNow = session?.liveClockNow ?? Date.now();

  const overlay = useMemo(
    () =>
      computeArenaStartOverlay(
        overlayGame,
        liveClockNow,
        session?.arenaCountdownComplete
      ),
    [overlayGame, liveClockNow, session?.arenaCountdownComplete]
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

  const showAbort = useMemo(() => {
    if (!overlay?.visible || !session?.game) {
      return false;
    }
    return canAbortArenaLaunchSyncAsPlayer(
      session.arenaOverlayGame ?? session.game,
      session.liveClockNow
    );
  }, [overlay?.visible, session?.arenaOverlayGame, session?.game, session?.liveClockNow]);

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
        {showAbort ? (
          <ArenaLaunchSyncAbort
            className="arena-start-overlay__abort"
            metaGame={session.game?.metaGame}
            tableId={session.game?.id}
          />
        ) : null}
      </div>
    </div>
  );
}

export { computeArenaStartOverlay } from "./ArenaStartOverlay.logic";
