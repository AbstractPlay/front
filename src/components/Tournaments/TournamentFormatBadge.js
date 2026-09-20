import { useTranslation } from "react-i18next";
import { isTwoLegTournament } from "../../lib/tournamentFormat";

/**
 * @param {{ tournament?: { matchLegs?: number }, matchLegs?: number, className?: string }} props
 */
export default function TournamentFormatBadge(props) {
  const { t } = useTranslation();
  const matchLegs = props.matchLegs ?? props.tournament?.matchLegs;
  if (!isTwoLegTournament({ matchLegs })) {
    return null;
  }
  const className = props.className
    ? `tag is-info is-light ${props.className}`
    : "tag is-info is-light";
  return (
    <span className={className} title={t("Tournament.TwoLegHelp")}>
      {t("Tournament.TwoLegBadge")}
    </span>
  );
}
