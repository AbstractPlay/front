import { useTranslation } from "react-i18next";
import { buildPlayerVacationTooltip } from "../lib/playerVacationTooltip";

/** @param {{ vacation?: object | null }} props */
export default function PlayerVacationDetail({ vacation }) {
  const { t, i18n } = useTranslation();
  if (!vacation) {
    return null;
  }
  const hasDetail =
    vacation.vacationActive
    || vacation.vacationScheduled
    || vacation.onVacation;
  if (!hasDetail) {
    return null;
  }
  const tooltip = buildPlayerVacationTooltip(vacation, t, i18n.language);
  const label = vacation.vacationScheduled && !vacation.vacationActive
    ? t("vacation.statusScheduled")
    : t("OnVacation");

  return (
    <div
      className="notification is-info is-light profile-vacation-detail mb-4"
      title={tooltip || undefined}
    >
      <p className="mb-1">
        <strong>{label}</strong>
      </p>
      {tooltip ? <p className="is-size-7 mb-0">{tooltip}</p> : null}
    </div>
  );
}
