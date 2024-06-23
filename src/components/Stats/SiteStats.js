import React, { useContext, useEffect, useState, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { SummaryContext } from "../../pages/Skeleton";
import TableSkeleton from "./TableSkeleton";
import Plot from "react-plotly.js";
import Flag from "../Flag";

function SiteStats(props) {
  const [summary] = useContext(SummaryContext);
  const [cumulative, cumulativeSetter] = useState([]);

  useEffect(() => {
    const lst = [];
    const firstTimers = [...summary.histograms.firstTimers].reverse();
    for (let i = 0; i < firstTimers.length; i++) {
      const subset = firstTimers.slice(0, i + 1);
      const sum = subset.reduce((prev, curr) => prev + curr, 0);
      lst.push(sum);
    }
    cumulativeSetter([...lst]);
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
        cell: (props) => (
            <Flag code={props.row.original.id} size="m" />
        )
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
                This shows the breakdown of countries players assert they are playing from. Only includes country codes the system can interpret.
            </p>
        </div>
        <TableSkeleton
            data={data}
            columns={columns}
            sort={[{ id: "n", desc: true }]}
        />
        <hr />
      </div>
      <div>
        <div className="content">
          <p>
            "Hours per move" is calculated as an average per game. Games that
            end by time out or on the first turn are not counted. A box plot
            shows the "hours per move" for each qualifying game record and gives
            a sense of the spread of that data. Outliers &gt;100 hours are not shown but are included in the calculations.
          </p>
        </div>
        <Plot
          data={[
            {
              y: summary.hoursPer.filter(x => x <= 100),
              type: "box",
              boxpoints: "False",
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
