import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProfileContext, SummaryContext } from "../Player";
import Plot from "react-plotly.js";

function Activity({ order }) {
  const { t } = useTranslation();
  const [user] = useContext(ProfileContext);
  const [summary] = useContext(SummaryContext);
  const [histogram, histogramSetter] = useState([]);
  const [moved, movedSetter] = useState(0);

  useEffect(() => {
    console.log("Update forced");
    movedSetter((m) => m + 1);
  }, [order]);

  useEffect(() => {
    if (summary !== null && user !== null) {
      const rec = summary.histograms.players.find((r) => r.user === user.id);
      if (rec !== undefined) {
        histogramSetter(rec.value);
      } else {
        histogramSetter([]);
      }
    } else {
      histogramSetter([]);
    }
  }, [summary, user]);

  return (
    <>
      <div style={{ overflow: "hidden" }} key={`PlotContainer|${moved}`}>
        <Plot
          data={[
            {
              y: [...histogram].reverse(),
              type: "bar",
            },
          ]}
          config={{
            responsive: true,
            displayModeBar: false,
          }}
          layout={{
            xaxis: { title: t("stats.siteStats.weekNumber") },
            yaxis: { title: t("player.stats.activity.axisY") },
            autosize: true,
          }}
        />
      </div>
    </>
  );
}

export default Activity;
