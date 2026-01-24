import React, { useEffect, useMemo, useState } from "react";
import { gameinfo } from "@abstractplay/gameslib";
import { createColumnHelper } from "@tanstack/react-table";
import Plot from "react-plotly.js";
import Modal from "../Modal";
import TableSkeleton from "./TableSkeleton";
import { useStore } from "../../stores";

function NumPlays({ metaFilter, nav }) {
  const summary = useStore((state) => state.summary);
  const [joined, joinedSetter] = useState([]);
  const [activeChartModal, activeChartModalSetter] = useState("");

  useEffect(() => {
    const lst = [];
    for (const obj of summary.plays.total) {
      let meta = null;
      const found = [...gameinfo.values()].find((i) => i.name === obj.game);
      if (found !== undefined) {
        meta = found.uid;
      }
      let hindex = 0;
      const hrec = summary.hMeta.find(({ user }) => user === meta);
      if (hrec !== undefined) {
        hindex = hrec.value;
      }
      const opps = summary.plays.width.find((g) => g.game === obj.game);
      const histogram = summary.histograms.meta.find(
        (x) => x.game === obj.game
      ).value;
      let histShort = histogram.slice(-10);
      while (histShort.length < 10) {
        histShort = [0, ...histShort];
      }
      const values = [];
      for (const entry of summary.histograms.meta) {
        values.push(...[...entry.value].slice(-10));
      }
      const histMax = Math.max(...values);
      lst.push({
        meta,
        hindex,
        game: obj.game,
        plays: obj.value,
        width: opps.value,
        histogram,
        histShort,
        histMax,
      });
      joinedSetter(lst);
    }
  }, [summary]);

  const openChartModal = (chart) => {
    activeChartModalSetter(chart);
    window.dispatchEvent(new Event("resize"));
  };

  const closeChartModal = () => {
    activeChartModalSetter("");
  };

  const data = useMemo(
    () =>
      joined
        .map(
          ({ game, plays, width, histogram, histShort, histMax, hindex }) => {
            return {
              id: game,
              game,
              plays,
              width,
              hindex,
              histogram,
              histShort,
              histMax,
            };
          }
        )
        .filter(
          (rec) =>
            metaFilter === undefined ||
            rec.game === metaFilter ||
            rec.game.startsWith(`${metaFilter} (`)
        )
        .sort((a, b) => b.plays - a.plays),
    [joined, metaFilter]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("game", {
        header: "Game",
      }),
      columnHelper.accessor("plays", {
        header: "Num plays",
      }),
      columnHelper.accessor("width", {
        header: "Num players",
      }),
      columnHelper.accessor("hindex", {
        header: "h-index",
      }),
      columnHelper.accessor("histogram", {
        header: "Histogram",
        cell: (props) => (
          <>
            <div
              style={{ width: "10em" }}
              onClick={() => openChartModal(props.row.original.game)}
            >
              <ul className="miniChart" key={props.row.original.game}>
                {props.row.original.histShort.map((n, i) => {
                  return (
                    <li key={`${props.row.original.game}|${i}`}>
                      <span
                        style={{
                          height: `${(n / props.row.original.histMax) * 100}%`,
                        }}
                      ></span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Modal
              buttons={[{ label: "Close", action: closeChartModal }]}
              show={
                activeChartModal !== "" &&
                activeChartModal === props.row.original.id
              }
              title={`Histogram for ${props.row.original.game}`}
            >
              <div style={{ overflow: "hidden" }}>
                <Plot
                  data={[
                    {
                      y: [...props.getValue()],
                      type: "bar",
                    },
                  ]}
                  config={{
                    responsive: true,
                    displayModeBar: false,
                  }}
                  layout={{
                    xaxis: { title: "Week #" },
                    yaxis: { title: "Completed games" },
                    margin: {
                      r: 160,
                    },
                  }}
                />
              </div>
            </Modal>
          </>
        ),
        enableSorting: false,
      }),
    ],
    [columnHelper, activeChartModal]
  );

  return (
    <TableSkeleton
      nav={nav}
      data={data}
      columns={columns}
      sort={[{ id: "plays", desc: true }]}
    />
  );
}

export default NumPlays;
