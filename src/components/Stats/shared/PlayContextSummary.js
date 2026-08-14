import React from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";

function PlayContextSummary() {
  const summary = useStore((state) => state.summary);
  const { t } = useTranslation();
  const playContext = summary.playContext;

  if (playContext === undefined) {
    return null;
  }

  const total = playContext.casual + playContext.event;

  return (
    <div className="content">
      <p>
        {t("stats.siteStats.playContext", {
          casual: playContext.casual.toLocaleString(),
          event: playContext.event.toLocaleString(),
          casualRate:
            total > 0
              ? (playContext.casual / total).toLocaleString(undefined, {
                  style: "percent",
                  minimumFractionDigits: 1,
                })
              : "—",
          eventRate:
            total > 0
              ? (playContext.event / total).toLocaleString(undefined, {
                  style: "percent",
                  minimumFractionDigits: 1,
                })
              : "—",
        })}
      </p>
    </div>
  );
}

export default PlayContextSummary;
