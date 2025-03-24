import React, { useContext, useEffect, useState, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { SummaryContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";
import Plot from "react-plotly.js";
import Flag from "../Flag";

const lstSummarize = (lst) => {
  if (lst.length === 0) {
    return undefined;
  }
  const sorted = [...lst].sort((a, b) => a - b);
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
  const [summary] = useContext(SummaryContext);
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
        header: "Country",
      }),
      columnHelper.display({
        id: "flag",
        cell: (props) => <Flag code={props.row.original.id} size="m" />,
      }),
      columnHelper.accessor("n", {
        header: "Count",
      }),
    ],
    [columnHelper]
  );

  return (
    <>
      <div>
        <div className="content">
          <p>
            Games are counted in seven-day chunks from the date the script ran.
            The right-most bar is the most recent seven days. The left-most bar
            is the first week completed games were recorded.
          </p>
          {summaryGames === null ? null : (
            <table>
              <caption>Cumulative</caption>
              <thead>
                <tr>
                  <th>Average</th>
                  <th>Median</th>
                  <th>Middle half</th>
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
              y: [...summary.histograms.all].reverse(),
              type: "bar",
            },
          ]}
          config={{
            responsive: true,
          }}
          layout={{
            title: "Games completed per week",
            xaxis: { title: "Week #" },
            yaxis: { title: "Completed games" },
            height: 500,
          }}
        />
        <hr />
      </div>
      <div>
        <div className="content">
          <p>
            Games are counted in seven-day chunks from the date the script ran.
            The right-most bar is the most recent seven days. The left-most bar
            is the first week completed games were recorded.
          </p>
          {summaryPlayers === null ? null : (
            <table>
              <caption>Cumulative</caption>
              <thead>
                <tr>
                  <th>Average</th>
                  <th>Median</th>
                  <th>Middle half</th>
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
              y: [...summary.histograms.allPlayers].reverse(),
              type: "bar",
            },
          ]}
          config={{
            responsive: true,
          }}
          layout={{
            title: "Number of players completing games per week",
            xaxis: { title: "Week #" },
            yaxis: { title: "Number of players" },
            height: 500,
          }}
        />
        <hr />
      </div>
      <div>
        <div className="content">
          <p>
            This graph tracks the number of users who completed their first game
            that week. The numbers are cumulative, meaning they will never
            decrease, and the right-most point should always show the current
            recorded user count. It is of course expected that the numbers will
            plateau at some point, but it gives an indication of growth.
          </p>
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
            title: "First-time game completions, cumulative",
            xaxis: { title: "Week #" },
            yaxis: { title: "Users who completed their first game" },
            height: 500,
          }}
        />
        <hr />
      </div>
      <div>
        <div className="content">
          <p>
            This shows the breakdown of countries players assert they are
            playing from. Only includes country codes the system can interpret.
          </p>
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
            Total cumulative timeout rate is{" "}
            {summary.timeoutRate.toLocaleString(undefined, {
              style: "percent",
              minimumFractionDigits: 2,
            })}
            .
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
            title: "Timeout rate per week",
            xaxis: { title: "Week #" },
            yaxis: { title: "Timeout rate", fixedrange: true, range: [0, 1] },
            height: 500,
          }}
        />
        <hr />
      </div>
      <div>
        <div className="content">
          <p>
            "Hours per move" is calculated as an average per game. Games that
            end by time out or on the first turn are not counted. A box plot
            shows the "hours per move" for each qualifying game record and gives
            a sense of the spread of that data. Outliers &gt;100 hours are not
            shown but are included in the calculations.
          </p>
        </div>
        <Plot
          data={[
            {
              y: summary.hoursPer.filter((x) => x <= 100),
              type: "box",
              boxpoints: false,
              orientation: "v",
              name: "Hours per move",
              jitter: 0.3,
            },
          ]}
          config={{
            responsive: true,
          }}
          layout={{
            title: "Hours per move",
            height: 500,
          }}
        />
      </div>
    </>
  );
}

export default SiteStats;
