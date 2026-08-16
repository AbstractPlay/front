import { useNavigate } from "react-router-dom";

/**
 * Queue navigation for beta layouts: one action — next game or dashboard.
 */
function QueueNavButtons({ t, waitingCount, onNextGame }) {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/", { replace: true });
    window.scrollTo(0, 0);
  };

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
