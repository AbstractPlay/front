import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ladderDetailPathFromGameRef } from "../../lib/ladderRoutes";
import { tournamentDetailPathFromGameRef } from "../../lib/tournamentRoutes";

/**
 * Event column for dashboard move tables (tournament or ladder context).
 */
export function GameEventContextCell({ tournament, ladderId, metaGame }) {
  const { t } = useTranslation();
  const ladderPath = ladderDetailPathFromGameRef(ladderId);
  const tournamentPath = tournamentDetailPathFromGameRef(
    tournament,
    metaGame,
    undefined
  );

  if (ladderPath) {
    return (
      <Link to={ladderPath} className="tag is-info is-light">
        {t("Ladder.badge")}
      </Link>
    );
  }
  if (tournamentPath) {
    return (
      <Link to={tournamentPath} className="tag is-warning is-light">
        {t("tables.tournament")}
      </Link>
    );
  }
  return "";
}
