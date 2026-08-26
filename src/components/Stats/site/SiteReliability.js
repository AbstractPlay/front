import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";
import WeekBarChart from "../shared/WeekBarChart";
import { combinedTimeoutAbandonRates } from "../shared/weekSummary";

function SiteReliability() {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();

  const combinedRates = useMemo(
    () =>
      combinedTimeoutAbandonRates(
        summary?.histograms?.timeouts ?? [],
        summary?.histograms?.abandoned
      ),
    [summary]
  );

  return (
    <>
      <div className="content">
        {summary?.timeoutRate != null ? (
          <p>
            {t("stats.siteStats.timeoutRate", {
              rate: summary.timeoutRate.toLocaleString(undefined, {
                style: "percent",
                minimumFractionDigits: 2,
              }),
            })}
          </p>
        ) : null}
        {summary?.abandonedRate !== undefined ? (
          <p>
            {t("stats.siteStats.abandonedRate", {
              rate: summary.abandonedRate.toLocaleString(undefined, {
                style: "percent",
                minimumFractionDigits: 2,
              }),
            })}
          </p>
        ) : null}
      </div>
      <WeekBarChart
        title={t("stats.siteStats.timeoutAbandonRatePerWeek")}
        y={combinedRates}
        xaxisTitle={t("stats.siteStats.weekNumber")}
        yaxisTitle={t("stats.siteStats.timeoutAbandonRateAxis")}
        yaxis={{ fixedrange: true, range: [0, 1] }}
      />
    </>
  );
}

export default SiteReliability;
