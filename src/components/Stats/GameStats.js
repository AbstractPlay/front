import React, { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import { useStore } from "../../stores";
import { useTranslation } from "react-i18next";
import {
  formatSummaryGameKey,
  matchesSummaryGameKey,
} from "../../lib/summaryGameKeys";

function GameStats({ metaFilter, nav }) {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      [...Object.keys(summary?.metaStats ?? {})]
        .map((gameKey) => {
          const rec = summary.metaStats[gameKey];
          return {
            id: gameKey,
            game: formatSummaryGameKey(gameKey, t),
            n: rec.n,
            lenAvg: Math.trunc(rec.lenAvg * 100) / 100,
            lenMedian: Math.trunc(rec.lenMedian * 100) / 100,
            winsFirst: Math.trunc(rec.winsFirst * 10000) / 100,
            drawRate: Math.trunc((rec.drawRate ?? 0) * 10000) / 100,
          };
        })
        .filter(
          (rec) =>
            metaFilter === undefined || matchesSummaryGameKey(rec.id, metaFilter)
        )
        .sort((a, b) => a.game.localeCompare(b.game)),
    [summary, metaFilter, t]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("game", {
        header: t("tables.game"),
      }),
      columnHelper.accessor("n", {
        header: t("tables.numRecords"),
      }),
      columnHelper.accessor("lenAvg", {
        header: t("tables.averageLength"),
      }),
      columnHelper.accessor("lenMedian", {
        header: t("tables.medianLength"),
      }),
      columnHelper.accessor("winsFirst", {
        header: t("tables.firstPlayerWins"),
        cell: (props) => props.getValue() + "%",
      }),
      columnHelper.accessor("drawRate", {
        header: t("tables.drawRate"),
        cell: (props) => props.getValue() + "%",
      }),
    ],
    [columnHelper, t]
  );

  return (
    <DataTable
      {...STATS_TABLE_PROPS}
      nav={nav}
      data={data}
      columns={columns}
      sort={[{ id: "game", desc: false }]}
    />
  );
}

export default GameStats;
