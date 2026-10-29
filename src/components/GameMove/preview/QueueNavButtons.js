import { useNavigate } from "react-router-dom";
import { arenaLandingPath } from "../../lib/arena/arenaRoutes";

/**
 * Queue navigation for beta layouts: next correspondence game or dashboard.
 * Arena post-game uses the main Arena lobby instead of the dashboard.
 */
function QueueNavButtons({ t, waitingCount, onNextGame, arenaBack = false }) {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/", { replace: true });
    window.scrollTo(0, 0);
  };

  const handleBackToArena = () => {
    navigate(arenaLandingPath(), { replace: true });
    window.scrollTo(0, 0);
  };

  if (arenaBack && waitingCount <= 0) {
    return (
      <div className="game-move-queue-nav">
        <button
          type="button"
          className="button is-small apButton"
          onClick={handleBackToArena}
        >
          {t("Arena.backToLobby")}
        </button>
      </div>
    );
  }

  if (waitingCount > 0) {
    return (
      <div className="game-move-queue-nav">
        <button
          type="button"
          className="button is-small apButton"
          onClick={onNextGame}
        >
          {t("NextGame")} ({waitingCount})
        </button>
      </div>
    );
  }

  return (
    <div className="game-move-queue-nav">
      <button
        type="button"
        className="button is-small apButton"
        onClick={handleBackToDashboard}
      >
        {t("NextGameNone")}
      </button>
    </div>
  );
}

export default QueueNavButtons;
