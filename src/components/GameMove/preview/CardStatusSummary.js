import GameStatus from "../GameStatus";
import { buildGameStatusProps, hasStatusContent } from "../../../lib/GameMove/gameMoveLayoutHelpers";

function CardStatusSummary({ session }) {
  const { t } = session;
  if (!hasStatusContent(session)) {
    return null;
  }

  return (
    <section className="game-move-queue-card__status" aria-labelledby="card-status">
      <h2 id="card-status" className="game-move-queue-card__section-heading">
        {t("Status")}
      </h2>
      <div className="game-move-queue-card__status-body">
        <GameStatus {...buildGameStatusProps(session)} />
      </div>
    </section>
  );
}

export default CardStatusSummary;
