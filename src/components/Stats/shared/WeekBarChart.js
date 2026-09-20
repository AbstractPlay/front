import React, { useMemo } from "react";
import BarChart from "../../shared/BarChart";
import { useChartHeight } from "../../shared/useChartHeight";
import { trimWeekSeriesForChart } from "./weekSummary";

function WeekBarChart({
  title,
  y,
  x,
  xaxisTitle,
  yaxisTitle,
  chartType = "line",
  yaxis,
  maxWeeks,
  heightDesktop = 500,
  heightMobile = 350,
}) {
  const height = useChartHeight(heightDesktop, heightMobile);
  const { chartY, chartX } = useMemo(() => {
    const sourceY = y ?? [];
    const trimmedY = trimWeekSeriesForChart(sourceY, maxWeeks);
    if (x === undefined) {
      return { chartY: trimmedY, chartX: undefined };
    }
    const dropCount = sourceY.length - trimmedY.length;
    const trimmedX =
      x.length === sourceY.length ? x.slice(dropCount) : x.slice(0, trimmedY.length);
    return { chartY: trimmedY, chartX: trimmedX };
  }, [maxWeeks, x, y]);
  const labels = chartX !== undefined ? chartX.map(String) : undefined;

  return (
    <BarChart
      data={[...chartY]}
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
