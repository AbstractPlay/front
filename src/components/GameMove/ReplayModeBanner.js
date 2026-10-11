import { useTranslation } from "react-i18next";
import { isReplayReadOnly } from "../../lib/GameMove/replay/shimEntry.js";

export default function ReplayModeBanner() {
  const { t } = useTranslation();
  if (!isReplayReadOnly()) {
    return null;
  }
  return (
    <div
      className="gamemove-replay-banner"
      role="status"
      data-testid="gamemove-replay-banner"
    >
      {t("gameMove.replay.banner")}
    </div>
  );
}
