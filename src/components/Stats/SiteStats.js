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
  const [hoursPerTrend, setHoursPerTrend] = useState([]);

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
    const byWeek = summary.hoursPer?.byWeek;
    if (Array.isArray(byWeek) && byWeek.length > 0) {
      let trend = byWeek.slice(0, -1);
      if (trend.length > 52) {
        trend = trend.slice(-52);
      }
      setHoursPerTrend(trend);
    } else {
      setHoursPerTrend([]);
    }
  }, [summary]);

  const hoursPerSummary =
    summary.hoursPer !== undefined && !Array.isArray(summary.hoursPer)
      ? summary.hoursPer
      : null;

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

  const activeGeoData = useMemo(
    () =>
      (summary.activeGeoStats ?? [])
        .map(({ code, name, n }) => ({
          id: code,
          code,
          name,
          n,
        }))
        .sort((a, b) => b.n - a.n),
    [summary]
  );

  const pieRateData = useMemo(
    () =>
      (summary.pieRates ?? []).map(({ game, n, pied, rate }) => ({
        id: game,
        game,
        n,
        pied,
        rate: Math.trunc(rate * 10000) / 100,
      })),
    [summary]
  );

  const playerCountMixData = useMemo(() => {
    const rows = [];
    for (const { game, byCount } of summary.playerCountMix ?? []) {
      for (const [playerCount, n] of Object.entries(byCount)) {
        rows.push({
          id: `${game}-${playerCount}`,
          game,
          playerCount: Number(playerCount),
          n,
        });
      }
    }
    return rows.sort(
      (a, b) => a.game.localeCompare(b.game) || a.playerCount - b.playerCount
    );
  }, [summary]);

  const playContext = summary.playContext;
  const totalPlayContext =
    playContext !== undefined ? playContext.casual + playContext.event : 0;

  const rivalryData = useMemo(
    () =>
      (summary.rivalries ?? []).map(({ rank, label, n }) => ({
        id: String(rank),
        rank,
        label,
        n,
      })),
    [summary]
  );

  const seasonality = summary.seasonality;
  const dowOrder = [1, 2, 3, 4, 5, 6, 0];
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
  const gamesByDow = useMemo(() => {
    if (seasonality?.gamesByDow === undefined) {
      return [];
    }
    return dowOrder.map((i) => seasonality.gamesByDow[i] ?? 0);
  }, [seasonality]);
  const playersByDow = useMemo(() => {
    if (seasonality?.playersByDow === undefined) {
      return [];
    }
    return dowOrder.map((i) => seasonality.playersByDow[i] ?? 0);
  }, [seasonality]);
  const gamesByHour = seasonality?.gamesByHour ?? [];
  const hourLabels = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i)),
    []
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

  const pieColumns = useMemo(
    () => [
      columnHelper.accessor("game", {
        header: t("tables.game"),
      }),
      columnHelper.accessor("n", {
        header: t("tables.numRecords"),
      }),
      columnHelper.accessor("pied", {
        header: t("tables.pieInvoked"),
      }),
      columnHelper.accessor("rate", {
        header: t("tables.pieRate"),
        cell: (props) => props.getValue() + "%",
      }),
    ],
    [columnHelper, t]
  );

  const playerCountColumns = useMemo(
    () => [
      columnHelper.accessor("game", {
        header: t("tables.game"),
      }),
      columnHelper.accessor("playerCount", {
        header: t("tables.playerCount"),
      }),
      columnHelper.accessor("n", {
        header: t("tables.numRecords"),
      }),
    ],
    [columnHelper, t]
  );

  const rivalryColumns = useMemo(
    () => [
      columnHelper.accessor("rank", {
        header: t("tables.rank"),
      }),
      columnHelper.accessor("label", {
        header: t("tables.rivalryPair"),
      }),
      columnHelper.accessor("n", {
        header: t("tables.gamesTogether"),
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
      {summary.histograms.returningPlayers !== undefined ? (
        <div>
          <div className="content">
            <p>{t("stats.siteStats.returningPlayersIntro")}</p>
          </div>
          <Plot
            data={[
              {
                y: [...summary.histograms.returningPlayers],
                type: "bar",
              },
            ]}
            config={{
              responsive: true,
            }}
            layout={{
              title: t("stats.siteStats.returningPlayersPerWeek"),
              xaxis: { title: t("stats.siteStats.weekNumber") },
              yaxis: { title: t("stats.siteStats.returningPlayers") },
              height: 500,
            }}
          />
          <hr />
        </div>
      ) : null}
      {playContext !== undefined ? (
        <div>
          <div className="content">
            <p>
              {t("stats.siteStats.playContext", {
                casual: playContext.casual.toLocaleString(),
                event: playContext.event.toLocaleString(),
                casualRate:
                  totalPlayContext > 0
                    ? (playContext.casual / totalPlayContext).toLocaleString(
                        undefined,
                        { style: "percent", minimumFractionDigits: 1 }
                      )
                    : "—",
                eventRate:
                  totalPlayContext > 0
                    ? (playContext.event / totalPlayContext).toLocaleString(
                        undefined,
                        { style: "percent", minimumFractionDigits: 1 }
                      )
                    : "—",
              })}
            </p>
          </div>
          <hr />
        </div>
      ) : null}
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
        {activeGeoData.length > 0 ? (
          <>
            <p>{t("stats.siteStats.activeCountryIntro")}</p>
            <TableSkeleton
              nav={nav}
              data={activeGeoData}
              columns={columns}
              sort={[{ id: "n", desc: true }]}
            />
          </>
        ) : null}
        <hr />
      </div>
      {pieRateData.length > 0 ? (
        <div>
          <div className="content">
            <p>{t("stats.siteStats.pieRateIntro")}</p>
          </div>
          <TableSkeleton
            nav={nav}
            data={pieRateData}
            columns={pieColumns}
            sort={[{ id: "game", desc: false }]}
          />
          <hr />
        </div>
      ) : null}
      {playerCountMixData.length > 0 ? (
        <div>
          <div className="content">
            <p>{t("stats.siteStats.playerCountMixIntro")}</p>
          </div>
          <TableSkeleton
            nav={nav}
            data={playerCountMixData}
            columns={playerCountColumns}
            sort={[
              { id: "game", desc: false },
              { id: "playerCount", desc: false },
            ]}
          />
          <hr />
        </div>
      ) : null}
      {rivalryData.length > 0 ? (
        <div>
          <div className="content">
            <p>{t("stats.siteStats.rivalriesIntro")}</p>
          </div>
          <TableSkeleton
            nav={nav}
            data={rivalryData}
            columns={rivalryColumns}
            sort={[{ id: "rank", desc: false }]}
          />
          <hr />
        </div>
      ) : null}
      {seasonality !== undefined ? (
        <div>
          <div className="content">
            <p>{t("stats.siteStats.seasonalityIntro")}</p>
          </div>
          <Plot
            data={[
              {
                x: dowLabels,
                y: gamesByDow,
                type: "bar",
              },
            ]}
            config={{
              responsive: true,
            }}
            layout={{
              title: t("stats.siteStats.gamesByDow"),
              xaxis: { title: t("stats.siteStats.dayOfWeekUtc") },
              yaxis: { title: t("stats.siteStats.completedGames") },
              height: 400,
            }}
          />
          <Plot
            data={[
              {
                x: dowLabels,
                y: playersByDow,
                type: "bar",
              },
            ]}
            config={{
              responsive: true,
            }}
            layout={{
              title: t("stats.siteStats.playersByDow"),
              xaxis: { title: t("stats.siteStats.dayOfWeekUtc") },
              yaxis: { title: t("stats.siteStats.numberOfPlayers") },
              height: 400,
            }}
          />
          <Plot
            data={[
              {
                x: hourLabels,
                y: gamesByHour,
                type: "bar",
              },
            ]}
            config={{
              responsive: true,
            }}
            layout={{
              title: t("stats.siteStats.gamesByHour"),
              xaxis: { title: t("stats.siteStats.hourOfDayUtc") },
              yaxis: { title: t("stats.siteStats.completedGames") },
              height: 400,
            }}
          />
          <hr />
        </div>
      ) : null}
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
          {summary.abandonedRate !== undefined ? (
            <p>
              {t("stats.siteStats.abandonedRate", {
                rate: summary.abandonedRate.toLocaleString(undefined, {
                  style: "percent",
                  minimumFractionDigits: 2,
                }),
              })}
            </p>
          ) : null}
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
        {summary.histograms.abandoned !== undefined ? (
          <>
            <Plot
              data={[
                {
                  y: [...summary.histograms.abandoned].reverse(),
                  type: "bar",
                },
              ]}
              config={{
                responsive: true,
              }}
              layout={{
                title: t("stats.siteStats.abandonedRatePerWeek"),
                xaxis: { title: t("stats.siteStats.weekNumber") },
                yaxis: {
                  title: t("stats.siteStats.abandonedRateAxis"),
                  fixedrange: true,
                  range: [0, 1],
                },
                height: 500,
              }}
            />
          </>
        ) : null}
        <hr />
      </div>
      <div>
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
          <Plot
            data={[
              {
                y: hoursPerTrend,
                type: "line",
              },
            ]}
            config={{
              responsive: true,
            }}
            layout={{
              title: t("stats.siteStats.hoursPerMovePerWeek"),
              xaxis: { title: t("stats.siteStats.weekNumber") },
              yaxis: { title: t("stats.siteStats.hoursPerMove") },
              height: 500,
            }}
          />
        ) : null}
      </div>
    </>
  );
}

export default SiteStats;
