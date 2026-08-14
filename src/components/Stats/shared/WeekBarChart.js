import React from "react";
import BarChart from "../../shared/BarChart";
import { useChartHeight } from "../../shared/useChartHeight";

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
  const labels = x !== undefined ? x.map(String) : undefined;

  return (
    <BarChart
      data={[...y]}
      labels={labels}
      title={title}
      xTitle={xaxisTitle}
      yTitle={yaxisTitle}
      height={height}
      yMin={yaxis?.range?.[0]}
      yMax={yaxis?.range?.[1]}
      chartType={chartType}
    />
  );
}

export default WeekBarChart;
