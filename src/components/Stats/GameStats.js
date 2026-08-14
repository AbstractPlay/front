import React, { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import { useStore } from "../../stores";
import { useTranslation } from "react-i18next";

function GameStats({ metaFilter, nav }) {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      [...Object.keys(summary.metaStats)]
        .map((game) => {
          const rec = summary.metaStats[game];
          return {
            id: game,
            game,
            n: rec.n,
            lenAvg: Math.trunc(rec.lenAvg * 100) / 100,
            lenMedian: Math.trunc(rec.lenMedian * 100) / 100,
            winsFirst: Math.trunc(rec.winsFirst * 10000) / 100,
            drawRate: Math.trunc((rec.drawRate ?? 0) * 10000) / 100,
          };
        })
        .filter(
          (rec) =>
            metaFilter === undefined ||
            rec.game === metaFilter ||
            rec.game.startsWith(`${metaFilter} (`)
        )
        .sort((a, b) => a.game.localeCompare(b.game)),
    [summary, metaFilter]
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

  return (
    <>
      <DataTable
        {...STATS_TABLE_PROPS}
        nav={nav}
        data={data}
        columns={columns}
        sort={[{ id: "game", desc: false }]}
      />
      {pieRateData.length > 0 ? (
        <>
          <hr />
          <div className="content">
            <p>{t("stats.gameStats.pieRateIntro")}</p>
          </div>
          <DataTable
        {...STATS_TABLE_PROPS}
            nav={nav}
            data={pieRateData}
            columns={pieColumns}
            sort={[{ id: "game", desc: false }]}
          />
        </>
      ) : null}
    </>
  );
}

export default GameStats;
