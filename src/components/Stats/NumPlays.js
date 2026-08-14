import React, { useMemo, useState } from "react";
import { gameinfo } from "@abstractplay/gameslib";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import HistogramSparkline from "./shared/HistogramSparkline";
import PlayContextSummary from "./shared/PlayContextSummary";
import { useStore } from "../../stores";
import { useTranslation } from "react-i18next";

function NumPlays({ metaFilter, nav }) {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();
  const [activeChartModal, activeChartModalSetter] = useState("");

  const data = useMemo(() => {
    const sparklineValues = [];
    for (const entry of summary.histograms.meta) {
      sparklineValues.push(...[...entry.value].slice(-10));
    }
    const histMax = Math.max(...sparklineValues, 1);

    return summary.plays.total
      .map((obj) => {
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
        return {
          id: obj.game,
          meta,
          hindex,
          game: obj.game,
          plays: obj.value,
          width: opps.value,
          histogram,
          histShort,
          histMax,
        };
      })
      .filter(
        (rec) =>
          metaFilter === undefined ||
          rec.game === metaFilter ||
          rec.game.startsWith(`${metaFilter} (`)
      )
      .sort((a, b) => b.plays - a.plays);
  }, [summary, metaFilter]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("game", {
        header: t("tables.game"),
      }),
      columnHelper.accessor("plays", {
        header: t("tables.numPlays"),
      }),
      columnHelper.accessor("width", {
        header: t("tables.numPlayersCount"),
      }),
      columnHelper.accessor("hindex", {
        header: t("tables.hIndex"),
      }),
      columnHelper.accessor("histogram", {
        header: t("tables.histogram"),
        cell: (props) => (
          <HistogramSparkline
            rowId={props.row.original.id}
            histShort={props.row.original.histShort}
            histogram={props.getValue()}
            histMax={props.row.original.histMax}
            modalTitle={t("stats.histogramFor", {
              name: props.row.original.game,
            })}
            isOpen={
              activeChartModal !== "" &&
              activeChartModal === props.row.original.id
            }
            onOpen={() => {
              activeChartModalSetter(props.row.original.id);
              window.dispatchEvent(new Event("resize"));
            }}
            onClose={() => activeChartModalSetter("")}
          />
        ),
        enableSorting: false,
      }),
    ],
    [columnHelper, activeChartModal, t]
  );

  return (
    <>
      {metaFilter === undefined ? <PlayContextSummary /> : null}
      <DataTable
        {...STATS_TABLE_PROPS}
        nav={nav}
        data={data}
        columns={columns}
        sort={[{ id: "plays", desc: true }]}
      />
    </>
  );
}

export default NumPlays;
