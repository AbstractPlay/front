import React, { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import DataTable, { STATS_TABLE_PROPS } from "../shared/DataTable";
import { useStore } from "../../stores";
import { formatGradeLabel, filterSoloMetaStats } from "../../lib/soloPlay";
import { formatSummaryGameKey } from "../../lib/summaryGameKeys";

function SoloMetaStatsPanel({ metaFilter, nav }) {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      filterSoloMetaStats(summary, metaFilter)
        .map(([key, rec]) => ({
          id: key,
          game: formatSummaryGameKey(key, t),
          attempts: rec.attempts,
          uniquePlayers: rec.uniquePlayers,
          repeatAttemptRate: Math.round(rec.repeatAttemptRate * 1000) / 10,
          scoreMedianBest: rec.scoreMedianBestPerUser,
          topGrade: rec.gradeHistogramBestPerUser
            ? Object.entries(rec.gradeHistogramBestPerUser).sort((a, b) => b[1] - a[1])[0]?.[0]
            : undefined,
        }))
        .sort((a, b) => a.game.localeCompare(b.game)),
    [summary, metaFilter, t]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("game", { header: t("tables.game") }),
      columnHelper.accessor("attempts", { header: t("solo.stats.attempts") }),
      columnHelper.accessor("uniquePlayers", {
        header: t("solo.stats.uniquePlayers"),
      }),
      columnHelper.accessor("repeatAttemptRate", {
        header: t("solo.stats.repeatRate"),
        cell: (props) => `${props.getValue()}%`,
      }),
      columnHelper.accessor("scoreMedianBest", {
        header: t("solo.stats.medianBestScore"),
        cell: (props) =>
          props.getValue() === undefined ? "" : props.getValue(),
      }),
      columnHelper.accessor("topGrade", {
        header: t("solo.stats.commonGrade"),
        cell: (props) => formatGradeLabel(props.getValue(), t),
      }),
    ],
    [columnHelper, t]
  );

  if (data.length === 0) {
    return <p>{t("solo.stats.empty")}</p>;
  }

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

export default SoloMetaStatsPanel;
