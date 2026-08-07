import React, { useEffect, useMemo, useRef, useState } from "react";
import Plot from "react-plotly.js";
import {
  getPastYearBarChartData,
  PAST_YEAR_AXIS_MAX,
} from "../../lib/playerProfileSections";

function notifyPlotlyResize() {
  window.dispatchEvent(new Event("resize"));
}

function PlayerWeeklyChart({ histogram, weekAxisTitle, yAxisTitle }) {
  const containerRef = useRef(null);
  const [plotReady, setPlotReady] = useState(false);
  const { x, y } = useMemo(
    () => getPastYearBarChartData(histogram),
    [histogram]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const updateReady = () => {
      const { width, height } = el.getBoundingClientRect();
      setPlotReady(width > 0 && height > 0);
      notifyPlotlyResize();
    };

    const ro = new ResizeObserver(updateReady);
    ro.observe(el);
    updateReady();

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(updateReady);
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [histogram]);

  const layout = useMemo(
    () => ({
      xaxis: {
        title: weekAxisTitle,
        range: [0, PAST_YEAR_AXIS_MAX],
        dtick: 13,
        fixedrange: true,
      },
      yaxis: { title: yAxisTitle },
      autosize: true,
      margin: { l: 48, r: 12, t: 8, b: 40 },
    }),
    [weekAxisTitle, yAxisTitle]
  );

  return (
    <div ref={containerRef} className="player-weekly-chart">
      {plotReady ? (
        <Plot
          data={[
            {
              x,
              y,
              type: "bar",
            },
          ]}
          config={{
            responsive: true,
            displayModeBar: false,
          }}
          layout={layout}
          useResizeHandler
          style={{ width: "100%", height: "100%" }}
        />
      ) : null}
    </div>
  );
}

export default PlayerWeeklyChart;
