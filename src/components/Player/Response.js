import React, { useContext, useEffect, useState } from "react";
import { ResponsesContext } from "../Player";
import Plot from "react-plotly.js";

function Response({ order }) {
  const [responses] = useContext(ResponsesContext);
  const [, movedSetter] = useState(0);
  const [parsed, parsedSetter] = useState([]);
  const [avg, avgSetter] = useState(0);
  const [median, medianSetter] = useState(0);

  useEffect(() => {
    console.log("Update forced");
    movedSetter((m) => m + 1);
  }, [order]);

  useEffect(() => {
    if (responses !== null && responses.length > 0) {
        const hours = responses.map(n => n / (1000 * 60 * 60)).sort((a,b) => a - b);
        parsedSetter(hours);
        const sum = hours.reduce((a,b) => a + b, 0);
        if (hours.length > 0) {
            avgSetter(sum / hours.length);
            medianSetter(hours[Math.floor(hours.length / 2)]);
        } else {
            avgSetter(0);
            medianSetter(0);
        }
    } else {
        parsedSetter([]);
        avgSetter(0);
        medianSetter(0);
    }
  }, [responses]);

  return (
    <>
      <div>
        <div className="content">
          <p>
            Average response time: {avg.toFixed(2)} hours
          </p>
          <p>
            Median response time: {median.toFixed(2)} hours
          </p>
        </div>
        <Plot
          data={[
            {
              y: parsed.filter(n => n < 500),
              type: "box",
              boxpoints: "suspectedoutliers",
              orientation: "v",
              name: "Time to move (hours)",
              jitter: 0.3,
            },
          ]}
          config={{
            responsive: true,
          }}
          layout={{
            title: "Time to move (hours)",
            height: 500,
          }}
        />
      </div>
    </>
  );
}

export default Response;
