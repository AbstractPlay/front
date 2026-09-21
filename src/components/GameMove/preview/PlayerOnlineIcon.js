import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import { shouldShowPlayerOnline } from "../../../lib/GameMove/playerPresence";

function PlayerOnlineIcon({ playerId, className = "" }) {
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const connections = useStore((state) => state.connections);

  if (!shouldShowPlayerOnline(globalMe, connections, playerId)) {
    return null;
  }

  return (
    <span
      className={`icon game-move-player-online${className ? ` ${className}` : ""}`}
      title={t("PlayerOnline")}
    >
      <i className="fa fa-wifi" aria-hidden="true" />
    </span>
  );
}

export default PlayerOnlineIcon;
