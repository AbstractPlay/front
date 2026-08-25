import React, { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import { useStore } from "../../stores";
import { useTranslation } from "react-i18next";
import { formatSummaryGameKey } from "../../lib/summaryGameKeys";

function PieStats({ nav }) {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();

  const pieRateData = useMemo(
    () =>
      (summary.pieRates ?? []).map(({ game, n, pied, rate }) => ({
        id: game,
        game: formatSummaryGameKey(game, t),
        n,
        pied,
        rate: Math.trunc(rate * 10000) / 100,
      })),
    [summary, t]
  );

  const columnHelper = createColumnHelper();
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

  if (pieRateData.length === 0) {
    return null;
  }

  return (
    <DataTable
      {...STATS_TABLE_PROPS}
      nav={nav}
      data={pieRateData}
      columns={pieColumns}
      sort={[{ id: "game", desc: false }]}
    />
  );
}

export default PieStats;
