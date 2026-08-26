import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import WeekSummaryTable from "../shared/WeekSummaryTable";
import WeekBarChart from "../shared/WeekBarChart";
import {
  firstTimersCumulative,
  lstSummarize,
  weekHistogramChart,
} from "../shared/weekSummary";

function SiteGrowth() {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();
  const histograms = summary?.histograms;

  const summaryGames = useMemo(
    () => lstSummarize(histograms?.all ?? []),
    [histograms]
  );
  const summaryPlayers = useMemo(
    () => lstSummarize(histograms?.allPlayers ?? []),
    [histograms]
  );
  const summaryActiveMovers = useMemo(
    () => lstSummarize(histograms?.activeMovers ?? []),
    [histograms]
  );
  const summaryReturningPlayers = useMemo(
    () => lstSummarize(histograms?.returningPlayers ?? []),
    [histograms]
  );
  const cumulative = useMemo(
    () => firstTimersCumulative(histograms?.firstTimers ?? []),
    [histograms]
  );
  const activeMoversChart = useMemo(
    () => weekHistogramChart(histograms?.activeMovers ?? []),
    [histograms]
  );

  return (
    <>
      <div className="content">
        <p>{t("stats.siteStats.weekBuckets")}</p>
        <WeekSummaryTable summary={summaryGames} />
      </div>
      <WeekBarChart
        title={t("stats.siteStats.gamesCompletedPerWeek")}
        y={histograms?.all ?? []}
        xaxisTitle={t("stats.siteStats.weekNumber")}
        yaxisTitle={t("stats.siteStats.completedGames")}
      />
      <hr />
      <div className="content">
        <p>{t("stats.siteStats.weekBuckets")}</p>
        <WeekSummaryTable summary={summaryPlayers} />
      </div>
      <WeekBarChart
        title={t("stats.siteStats.playersCompletedPerWeek")}
        y={histograms?.allPlayers ?? []}
        xaxisTitle={t("stats.siteStats.weekNumber")}
        yaxisTitle={t("stats.siteStats.numberOfPlayers")}
      />
      <hr />
      {histograms?.activeMovers !== undefined ? (
        <>
          <div className="content">
            <p>{t("stats.siteStats.activeMoversIntro")}</p>
            <WeekSummaryTable summary={summaryActiveMovers} />
          </div>
          <WeekBarChart
            title={t("stats.siteStats.activeMoversPerWeek")}
            x={activeMoversChart.x}
            y={activeMoversChart.y}
            xaxisTitle={t("stats.siteStats.weekNumber")}
            yaxisTitle={t("stats.siteStats.numberOfPlayers")}
          />
          <hr />
        </>
      ) : null}
      <div className="content">
        <p>{t("stats.siteStats.firstTimersIntro")}</p>
      </div>
      <WeekBarChart
        title={t("stats.siteStats.firstTimersCumulative")}
        y={cumulative}
        chartType="line"
        xaxisTitle={t("stats.siteStats.weekNumber")}
        yaxisTitle={t("stats.siteStats.usersFirstGame")}
      />
      <hr />
      {histograms?.returningPlayers !== undefined ? (
        <>
          <div className="content">
            <p>{t("stats.siteStats.returningPlayersIntro")}</p>
            <WeekSummaryTable summary={summaryReturningPlayers} />
          </div>
          <WeekBarChart
            title={t("stats.siteStats.returningPlayersPerWeek")}
            y={histograms.returningPlayers}
            xaxisTitle={t("stats.siteStats.weekNumber")}
            yaxisTitle={t("stats.siteStats.returningPlayers")}
          />
          <hr />
        </>
      ) : null}
    </>
  );
}

export default SiteGrowth;
