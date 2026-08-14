import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import WeekBarChart from "../shared/WeekBarChart";
import { hoursPerTrendSeries } from "../shared/weekSummary";

function SitePace() {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();

  const hoursPerSummary =
    summary.hoursPer !== undefined && !Array.isArray(summary.hoursPer)
      ? summary.hoursPer
      : null;

  const hoursPerTrend = useMemo(
    () => hoursPerTrendSeries(summary.hoursPer?.byWeek),
    [summary]
  );

  return (
    <>
      <div className="content">
        <p>{t("stats.siteStats.hoursPerMoveIntro")}</p>
        {hoursPerSummary === null ? null : (
          <table>
            <caption>{t("stats.siteStats.hoursPerMove")}</caption>
            <thead>
              <tr>
                <th>{t("stats.siteStats.hoursPerMoveMean")}</th>
                <th>{t("stats.siteStats.hoursPerMoveMedian")}</th>
                <th>{t("stats.siteStats.hoursPerMoveGames")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {hoursPerSummary.mean.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>
                  {hoursPerSummary.median.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>{hoursPerSummary.n.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
      {hoursPerTrend.length > 0 ? (
        <WeekBarChart
          title={t("stats.siteStats.hoursPerMovePerWeek")}
          y={hoursPerTrend}
          chartType="line"
          xaxisTitle={t("stats.siteStats.weekNumber")}
          yaxisTitle={t("stats.siteStats.hoursPerMove")}
        />
      ) : null}
    </>
  );
}

export default SitePace;
