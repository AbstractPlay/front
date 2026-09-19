import React from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import WeekBarChart from "../shared/WeekBarChart";

function SitePace() {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();

  const hoursPerSummary =
    summary?.hoursPer !== undefined && !Array.isArray(summary.hoursPer)
      ? summary.hoursPer
      : null;
  const hoursPerTableReady =
    hoursPerSummary != null &&
    hoursPerSummary.mean != null &&
    hoursPerSummary.median != null &&
    hoursPerSummary.n != null;

  const hoursPerByWeek = summary?.hoursPer?.byWeek;

  return (
    <>
      <div className="content">
        <p>{t("stats.siteStats.hoursPerMoveIntro")}</p>
        {hoursPerTableReady ? (
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
        ) : null}
      </div>
      {Array.isArray(hoursPerByWeek) && hoursPerByWeek.length > 1 ? (
        <WeekBarChart
          title={t("stats.siteStats.hoursPerMovePerWeek")}
          y={hoursPerByWeek}
          maxWeeks={52}
          xaxisTitle={t("stats.siteStats.weekNumber")}
          yaxisTitle={t("stats.siteStats.hoursPerMove")}
        />
      ) : null}
    </>
  );
}

export default SitePace;
