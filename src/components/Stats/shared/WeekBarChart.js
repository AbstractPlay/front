import React from "react";
import Plot from "react-plotly.js";
import { PLOTLY_CONFIG, useChartHeight } from "./plotlyLayout";

function WeekBarChart({
  title,
  y,
  x,
  xaxisTitle,
  yaxisTitle,
  chartType = "bar",
  yaxis,
  heightDesktop = 500,
  heightMobile = 350,
}) {
  const height = useChartHeight(heightDesktop, heightMobile);
  const trace = { y: [...y], type: chartType };
  if (x !== undefined) {
    trace.x = [...x];
  }

  return (
    <Plot
      data={[trace]}
      config={PLOTLY_CONFIG}
      layout={{
        title,
        xaxis: { title: xaxisTitle },
        yaxis: { title: yaxisTitle, ...yaxis },
        height,
      }}
    />
  );
}

export default WeekBarChart;
