import React, { useContext, useEffect, useState } from "react";
import { ProfileContext, SummaryContext, AllRecsContext } from "../Player";
import Plot from "react-plotly.js";

function Timeouts({ order }) {
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
        <p>Total number of timeouts: {timeouts.length.toLocaleString()}</p>
        {gamesSince === null ? null : (
          <p>
            Games completed since last timeout: {gamesSince.toLocaleString()}
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
            xaxis: { title: "Week #" },
            yaxis: { title: "Timeouts" },
            autosize: true,
          }}
          // style={{
          //     height: "100%",
          //     width: "100%",
          // }}
        />
      </div>
    </>
  );
}

export default Timeouts;
