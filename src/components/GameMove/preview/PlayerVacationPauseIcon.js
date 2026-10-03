import { useTranslation } from "react-i18next";

function PlayerVacationPauseIcon({ className = "" }) {
  const { t } = useTranslation();
  return (
    <span
      className={`icon game-move-player-vacation-pause${
        className ? ` ${className}` : ""
      }`}
      title={t("ClockPaused")}
    >
      <i className="fa fa-pause" aria-hidden="true" />
    </span>
  );
}

export default PlayerVacationPauseIcon;
