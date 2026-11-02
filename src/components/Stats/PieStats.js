import React, { useMemo } from "react";
import {
  rowMeetsMinNumRecords,
  useMinNumRecordsFilter,
  useMinNumRecordsNavEnd,
} from "./shared/minNumRecordsFilter";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import { useStore } from "../../stores";
import { useTranslation } from "react-i18next";
import { formatSummaryGameKey } from "../../lib/summaryGameKeys";
import { summaryGameKeySortingFn } from "../../lib/variantTableSort";

function PieStats({ nav }) {
  const summary = useStore((state) => state.summary);
  const { t, i18n } = useTranslation();
  const { minNumRecords, setMinNumRecords } = useMinNumRecordsFilter();
  const navEnd = useMinNumRecordsNavEnd(
    minNumRecords,
    setMinNumRecords,
    "stats-min-num-records-pieStats"
  );

  const pieRateData = useMemo(
    () =>
      (summary.pieRates ?? [])
        .map(({ game, n, pied, rate }) => ({
          id: game,
          gameKey: game,
          game: formatSummaryGameKey(game, t),
          n,
          pied,
          rate: Math.trunc(rate * 10000) / 100,
        }))
        .filter((row) => rowMeetsMinNumRecords(row, minNumRecords)),
    [summary, minNumRecords, t]
  );

  const columnHelper = createColumnHelper();
  const pieColumns = useMemo(
    () => [
      columnHelper.accessor("game", {
        header: t("tables.game"),
        sortingFn: summaryGameKeySortingFn(i18n.language),
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
    [columnHelper, t, i18n.language]
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
      navEnd={navEnd}
      resetPageIndexDeps={[minNumRecords]}
    />
  );
}

export default PieStats;
