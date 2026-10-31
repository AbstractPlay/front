import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ladderDetailPathFromGameRef } from "../../lib/ladderRoutes";
import { tournamentDetailPathFromGameRef } from "../../lib/tournamentRoutes";

/**
 * Event column for dashboard move tables (ladder, tournament, or organized event).
 */
export function GameEventContextCell({ tournament, ladderId, event, metaGame }) {
  const { t } = useTranslation();
  const ladderPath = ladderDetailPathFromGameRef(ladderId);
  const tournamentPath = tournamentDetailPathFromGameRef(
    tournament,
    metaGame,
    undefined
  );
  const eventId =
    event === undefined || event === null || event === "" ? null : String(event);
  const eventPath = eventId ? `/event/${eventId}` : null;

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
  if (eventPath) {
    return (
      <Link to={eventPath} className="tag is-link is-light">
        {t("Events.badge")}
      </Link>
    );
  }
  return "";
}
