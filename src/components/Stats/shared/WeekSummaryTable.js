import React from "react";
import { useTranslation } from "react-i18next";

function WeekSummaryTable({ summary, captionKey }) {
  const { t } = useTranslation();

  if (summary === undefined || summary === null) {
    return null;
  }

  const fmt = (n) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <table>
      <caption>{t(captionKey ?? "stats.siteStats.cumulativePastYear")}</caption>
      <thead>
        <tr>
          <th>{t("stats.siteStats.average")}</th>
          <th>{t("stats.siteStats.median")}</th>
          <th>{t("stats.siteStats.middleHalf")}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{fmt(summary.avg)}</td>
          <td>{fmt(summary.median)}</td>
          <td>
            {fmt(summary.q1)}–{fmt(summary.q3)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default WeekSummaryTable;
