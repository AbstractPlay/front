import React, { useContext, useEffect, useState } from "react";
import { ProfileContext, SummaryContext } from "../Player";
import Plot from "react-plotly.js";

function Activity({ order }) {
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
              y: [...histogram],
              type: "bar",
            },
          ]}
          config={{
            responsive: true,
            displayModeBar: false,
          }}
          layout={{
            xaxis: { title: "Week #" },
            yaxis: { title: "Completed games" },
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

export default Activity;
