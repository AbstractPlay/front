import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import BarChart from "../../shared/BarChart";
import { useChartHeight } from "../../shared/useChartHeight";

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

function SiteSeasonality() {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();
  const height = useChartHeight(400, 300);
  const seasonality = summary.seasonality;

  const dowLabels = useMemo(
    () => [
      t("stats.siteStats.dowMon"),
      t("stats.siteStats.dowTue"),
      t("stats.siteStats.dowWed"),
      t("stats.siteStats.dowThu"),
      t("stats.siteStats.dowFri"),
      t("stats.siteStats.dowSat"),
      t("stats.siteStats.dowSun"),
    ],
    [t]
  );

  const movesByDow = useMemo(() => {
    if (seasonality?.movesByDow === undefined) {
      return [];
    }
    return DOW_ORDER.map((i) => seasonality.movesByDow[i] ?? 0);
  }, [seasonality]);

  const playersByDow = useMemo(() => {
    if (seasonality?.playersByDow === undefined) {
      return [];
    }
    return DOW_ORDER.map((i) => seasonality.playersByDow[i] ?? 0);
  }, [seasonality]);

  const movesByHour = seasonality?.movesByHour ?? [];
  const hourLabels = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i)),
    []
  );

  if (seasonality?.movesByDow === undefined) {
    return null;
  }

  return (
    <>
      <div className="content">
        <p>
          {t("stats.siteStats.seasonalityIntro", {
            days: seasonality.windowDays ?? 365,
          })}
        </p>
      </div>
      <BarChart
        data={movesByDow}
        labels={dowLabels}
        title={t("stats.siteStats.movesByDow")}
        xTitle={t("stats.siteStats.dayOfWeekUtc")}
        yTitle={t("stats.siteStats.movesMade")}
        height={height}
      />
      <BarChart
        data={playersByDow}
        labels={dowLabels}
        title={t("stats.siteStats.playersByDow")}
        xTitle={t("stats.siteStats.dayOfWeekUtc")}
        yTitle={t("stats.siteStats.activePlayers")}
        height={height}
      />
      <BarChart
        data={movesByHour}
        labels={hourLabels}
        title={t("stats.siteStats.movesByHour")}
        xTitle={t("stats.siteStats.hourOfDayUtc")}
        yTitle={t("stats.siteStats.movesMade")}
        height={height}
        xTickStep={3}
      />
    </>
  );
}

export default SiteSeasonality;
