import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProfileContext, SummaryContext, AllRecsContext } from "../Player";
import Plot from "react-plotly.js";

function Timeouts({ order }) {
  const { t } = useTranslation();
  const [user] = useContext(ProfileContext);
  const [summary] = useContext(SummaryContext);
  const [allRecs] = useContext(AllRecsContext);
  const [histogram, histogramSetter] = useState([]);
  const [moved, movedSetter] = useState(0);
  const [timeouts, timeoutsSetter] = useState([]);
  const [gamesSince, gamesSinceSetter] = useState(null);

  useEffect(() => {
    console.log("Update forced");
    movedSetter((m) => m + 1);
  }, [order]);

  useEffect(() => {
    if (summary !== null && user !== null) {
      const rec = summary.histograms.playerTimeouts.find(
        (r) => r.user === user.id
      );
      if (rec !== undefined) {
        histogramSetter(rec.value);
      } else {
        histogramSetter([]);
      }
      const toIndiv = summary.players.timeouts.filter(
        (rec) => rec.user === user.id
      );
      timeoutsSetter(toIndiv);
      const toLatest = Math.max(0, ...toIndiv.map((rec) => rec.value));
      let count = 0;
      for (const rec of allRecs) {
        const datems = new Date(rec.header["date-end"]).getTime();
        if (datems > toLatest) {
          count++;
        }
      }
      gamesSinceSetter(count);
    } else {
      gamesSinceSetter(null);
      timeoutsSetter([]);
      histogramSetter([]);
    }
  }, [summary, user, allRecs]);

  return (
    <>
      <div className="content">
        <p>
          {t("player.stats.timeouts.total", {
            count: timeouts.length.toLocaleString(),
          })}
        </p>
        {gamesSince === null ? null : (
          <p>
            {t("player.stats.timeouts.gamesSince", {
              count: gamesSince.toLocaleString(),
            })}
          </p>
        )}
      </div>
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
            yaxis: { title: t("player.stats.timeouts.axisY") },
            autosize: true,
          }}
        />
      </div>
    </>
  );
}

export default Timeouts;
