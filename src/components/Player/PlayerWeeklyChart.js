import React, { useMemo } from "react";
import BarChart from "../shared/BarChart";
import { useChartHeight } from "../shared/useChartHeight";
import { getPastYearBarChartData } from "../../lib/playerProfileSections";

function PlayerWeeklyChart({
  histogram,
  siteWeekCount,
  weekAxisTitle,
  yAxisTitle,
}) {
  const height = useChartHeight(350, 280);
  const { x, y } = useMemo(
    () => getPastYearBarChartData(histogram, { siteWeekCount }),
    [histogram, siteWeekCount]
  );

  return (
    <div className="player-weekly-chart">
      <BarChart
        data={y}
        labels={x.map(String)}
        xTitle={weekAxisTitle}
        yTitle={yAxisTitle}
        height={height}
        xTickStep={13}
      />
    </div>
  );
}

export default PlayerWeeklyChart;
