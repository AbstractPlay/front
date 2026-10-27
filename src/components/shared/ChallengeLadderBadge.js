import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ladderDetailPathFromGameRef } from "../../lib/ladderRoutes";

/** Ladder indicator for challenge modals (matches dashboard challenge table chip). */
export function ChallengeLadderBadge({ ladderId }) {
  const { t } = useTranslation();
  if (!ladderId) {
    return null;
  }
  const path = ladderDetailPathFromGameRef(ladderId);
  const label = t("Ladder.badge");
  if (!path) {
    return <span className="tag is-info is-light">{label}</span>;
  }
  return (
    <Link to={path} className="tag is-info is-light">
      {label}
    </Link>
  );
}
