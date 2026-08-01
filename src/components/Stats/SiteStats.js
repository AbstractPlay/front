import React, { useEffect, useState, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import TableSkeleton from "./TableSkeleton";
import Plot from "react-plotly.js";
import Flag from "../Flag";
import { useStore } from "../../stores";
import { useTranslation } from "react-i18next";

const lstSummarize = (lst) => {
  if (lst.length === 0) {
    return undefined;
  }
  // drop the most recent (usually partial) week
  let newLst = lst.slice(0, -1);
  // now just keep the most recent 52 weeks
  if (newLst.length > 52) {
    newLst = newLst.slice(-52);
  }
  const sorted = [...newLst].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / sorted.length;
  let median;
  if (sorted.length % 2 === 0) {
    const idx1 = Math.floor(sorted.length / 2);
    const idx2 = idx1 - 1;
    median = (sorted[idx1] + sorted[idx2]) / 2;
  } else {
    median = sorted[Math.floor(sorted.length / 2)];
  }
  const qWidth = Math.floor(sorted.length / 4);
  const q1 = sorted[qWidth];
  const q3 = sorted[qWidth * 3];
  return { avg, median, q1, q3 };
};

function SiteStats({ nav }) {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();
  const [cumulative, cumulativeSetter] = useState([]);
  const [summaryGames, setSummaryGames] = useState(null);
  const [summaryPlayers, setSummaryPlayers] = useState(null);

  useEffect(() => {
    const lst = [];
    const firstTimers = [...summary.histograms.firstTimers].reverse();
    for (let i = 0; i < firstTimers.length; i++) {
      const subset = firstTimers.slice(0, i + 1);
      const sum = subset.reduce((prev, curr) => prev + curr, 0);
      lst.push(sum);
    }
    cumulativeSetter([...lst]);
    setSummaryGames(lstSummarize(summary.histograms.all));
    setSummaryPlayers(lstSummarize(summary.histograms.allPlayers));
  }, [summary]);

  const data = useMemo(
    () =>
      summary.geoStats
        .map(({ code, name, n }) => {
          return {
            id: code,
            code,
            name,
            n,
          };
        })
        .sort((a, b) => b.n - a.n),
    [summary]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("tables.country"),
      }),
      columnHelper.display({
        id: "flag",
        cell: (props) => <Flag code={props.row.original.id} size="m" />,
      }),
      columnHelper.accessor("n", {
        header: t("tables.count"),
      }),
    ],
    [columnHelper, t]
  );

  return (
    <>
      <div>
        <div className="content">
          <p>{t("stats.siteStats.weekBuckets")}</p>
          {summaryGames === null ? null : (
            <table>
              <caption>{t("stats.siteStats.cumulativePastYear")}</caption>
              <thead>
                <tr>
                  <th>{t("stats.siteStats.average")}</th>
                  <th>{t("stats.siteStats.median")}</th>
                  <th>{t("stats.siteStats.middleHalf")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {summaryGames.avg.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    {summaryGames.median.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    {summaryGames.q1.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                    –
                    {summaryGames.q3.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        <Plot
          data={[
            {
              y: [...summary.histograms.all],
              type: "bar",
            },
          ]}
          config={{
            responsive: true,
          }}
          layout={{
            title: t("stats.siteStats.gamesCompletedPerWeek"),
            xaxis: { title: t("stats.siteStats.weekNumber") },
            yaxis: { title: t("stats.siteStats.completedGames") },
            height: 500,
          }}
        />
        <hr />
      </div>
      <div>
        <div className="content">
          <p>{t("stats.siteStats.weekBuckets")}</p>
          {summaryPlayers === null ? null : (
            <table>
              <caption>{t("stats.siteStats.cumulativePastYear")}</caption>
              <thead>
                <tr>
                  <th>{t("stats.siteStats.average")}</th>
                  <th>{t("stats.siteStats.median")}</th>
                  <th>{t("stats.siteStats.middleHalf")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {summaryPlayers.avg.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    {summaryPlayers.median.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    {summaryPlayers.q1.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                    –
                    {summaryPlayers.q3.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        <Plot
          data={[
            {
              y: [...summary.histograms.allPlayers],
              type: "bar",
            },
          ]}
          config={{
            responsive: true,
          }}
          layout={{
            title: t("stats.siteStats.playersCompletedPerWeek"),
            xaxis: { title: t("stats.siteStats.weekNumber") },
            yaxis: { title: t("stats.siteStats.numberOfPlayers") },
            height: 500,
          }}
        />
        <hr />
      </div>
      <div>
        <div className="content">
          <p>{t("stats.siteStats.firstTimersIntro")}</p>
        </div>
        <Plot
          data={[
            {
              y: [...cumulative],
              type: "line",
            },
          ]}
          config={{
            responsive: true,
          }}
          layout={{
            title: t("stats.siteStats.firstTimersCumulative"),
            xaxis: { title: t("stats.siteStats.weekNumber") },
            yaxis: { title: t("stats.siteStats.usersFirstGame") },
            height: 500,
          }}
        />
        <hr />
      </div>
      <div>
        <div className="content">
          <p>{t("stats.siteStats.countryIntro")}</p>
        </div>
        <TableSkeleton
          nav={nav}
          data={data}
          columns={columns}
          sort={[{ id: "n", desc: true }]}
        />
        <hr />
      </div>
      <div>
        <div className="content">
          <p>
            {t("stats.siteStats.timeoutRate", {
              rate: summary.timeoutRate.toLocaleString(undefined, {
                style: "percent",
                minimumFractionDigits: 2,
              }),
            })}
          </p>
        </div>
        <Plot
          data={[
            {
              y: [...summary.histograms.timeouts].reverse(),
              type: "bar",
            },
          ]}
          config={{
            responsive: true,
          }}
          layout={{
            title: t("stats.siteStats.timeoutRatePerWeek"),
            xaxis: { title: t("stats.siteStats.weekNumber") },
            yaxis: {
              title: t("stats.siteStats.timeoutRateAxis"),
              fixedrange: true,
              range: [0, 1],
            },
            height: 500,
          }}
        />
        <hr />
      </div>
      <div>
        <div className="content">
          <p>{t("stats.siteStats.hoursPerMoveIntro")}</p>
        </div>
        <Plot
          data={[
            {
              y: summary.hoursPer.filter((x) => x <= 100),
              type: "box",
              boxpoints: false,
              orientation: "v",
              name: t("stats.siteStats.hoursPerMove"),
              jitter: 0.3,
            },
          ]}
          config={{
            responsive: true,
          }}
          layout={{
            title: t("stats.siteStats.hoursPerMove"),
            height: 500,
          }}
        />
      </div>
    </>
  );
}

export default SiteStats;
