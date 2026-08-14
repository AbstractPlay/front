import React, { useMemo } from "react";
import Plot from "react-plotly.js";
import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import { PLOTLY_CONFIG, useChartHeight } from "../shared/plotlyLayout";

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
      <Plot
        data={[{ x: dowLabels, y: movesByDow, type: "bar" }]}
        config={PLOTLY_CONFIG}
        layout={{
          title: t("stats.siteStats.movesByDow"),
          xaxis: { title: t("stats.siteStats.dayOfWeekUtc") },
          yaxis: { title: t("stats.siteStats.movesMade") },
          height,
        }}
      />
      <Plot
        data={[{ x: dowLabels, y: playersByDow, type: "bar" }]}
        config={PLOTLY_CONFIG}
        layout={{
          title: t("stats.siteStats.playersByDow"),
          xaxis: { title: t("stats.siteStats.dayOfWeekUtc") },
          yaxis: { title: t("stats.siteStats.activePlayers") },
          height,
        }}
      />
      <Plot
        data={[{ x: hourLabels, y: movesByHour, type: "bar" }]}
        config={PLOTLY_CONFIG}
        layout={{
          title: t("stats.siteStats.movesByHour"),
          xaxis: { title: t("stats.siteStats.hourOfDayUtc") },
          yaxis: { title: t("stats.siteStats.movesMade") },
          height,
        }}
      />
    </>
  );
}

export default SiteSeasonality;
