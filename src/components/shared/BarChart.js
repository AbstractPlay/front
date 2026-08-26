import React, { useMemo } from "react";

const VIEW_WIDTH = 800;
const MARGIN = { top: 8, right: 16, bottom: 52, left: 56 };

function formatYTick(value, yMax) {
  if (yMax <= 1) {
    return value.toLocaleString(undefined, {
      style: "percent",
      maximumFractionDigits: 0,
    });
  }
  if (Number.isInteger(value) || Math.abs(value) >= 10) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatTooltipValue(value, yMax) {
  if (yMax <= 1) {
    return value.toLocaleString(undefined, {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
  }
  if (Number.isInteger(value) || Math.abs(value) >= 10) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function buildPointTooltip(xLabel, value, xTitle, yTitle, yMax) {
  const lines = [];
  if (xTitle) {
    lines.push(`${xTitle}: ${xLabel}`);
  } else {
    lines.push(String(xLabel));
  }
  const formatted = formatTooltipValue(value, yMax);
  if (yTitle) {
    lines.push(`${yTitle}: ${formatted}`);
  } else {
    lines.push(formatted);
  }
  return lines.join("\n");
}

function buildYTicks(min, max, count = 5) {
  if (max <= min) {
    return [min];
  }
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
}

function buildXTicks(length, step) {
  if (length <= 0) {
    return [];
  }
  const tickStep = step ?? (length > 24 ? Math.ceil(length / 8) : 1);
  const ticks = [];
  for (let i = 0; i < length; i += tickStep) {
    ticks.push(i);
  }
  if (ticks[ticks.length - 1] !== length - 1) {
    ticks.push(length - 1);
  }
  return ticks;
}

function BarChart({
  data = [],
  labels,
  title,
  xTitle,
  yTitle,
  height = 400,
  yMin,
  yMax,
  xTickStep,
  chartType = "bar",
  className = "",
}) {
  const values = useMemo(
    () =>
      data.map((value) => (Number.isFinite(Number(value)) ? Number(value) : 0)),
    [data]
  );
  const count = values.length;
  const computedYMin = yMin ?? 0;
  const dataMax = count > 0 ? Math.max(...values, computedYMin) : 1;
  const computedYMax =
    yMax ?? (dataMax > computedYMin ? dataMax : computedYMin + 1);
  const xLabels = useMemo(
    () =>
      labels?.length === count
        ? labels
        : values.map((_, index) => String(index)),
    [labels, count, values]
  );

  const chartHeight = Math.max(height - MARGIN.top - MARGIN.bottom, 1);
  const chartWidth = VIEW_WIDTH - MARGIN.left - MARGIN.right;
  const yRange = computedYMax - computedYMin || 1;
  const yScale = (value) =>
    chartHeight - ((value - computedYMin) / yRange) * chartHeight;
  const slotWidth = count > 0 ? chartWidth / count : 0;
  const yTicks = buildYTicks(computedYMin, computedYMax);
  const xTicks = buildXTicks(count, xTickStep);

  return (
    <figure
      className={`ap-chart${className ? ` ${className}` : ""}`}
      style={{ aspectRatio: `${VIEW_WIDTH} / ${height}` }}
      aria-label={title ?? undefined}
    >
      {title ? (
        <figcaption className="ap-chart-title">{title}</figcaption>
      ) : null}
      <svg
        className="ap-chart-svg"
        aria-hidden="true"
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {yTicks.map((tick) => (
            <g key={tick} className="ap-chart-grid-layer">
              <line
                x1={0}
                y1={yScale(tick)}
                x2={chartWidth}
                y2={yScale(tick)}
                className="ap-chart-grid"
              />
              <text
                x={-8}
                y={yScale(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="ap-chart-tick"
              >
                {formatYTick(tick, computedYMax)}
              </text>
            </g>
          ))}

          {chartType === "line" ? (
            <>
              <polyline
                className="ap-chart-line"
                fill="none"
                pointerEvents="none"
                points={values
                  .map(
                    (value, index) =>
                      `${index * slotWidth + slotWidth / 2},${yScale(value)}`
                  )
                  .join(" ")}
              />
              {values.map((value, index) => (
                <rect
                  key={index}
                  x={index * slotWidth}
                  y={0}
                  width={slotWidth}
                  height={chartHeight}
                  className="ap-chart-hit"
                  aria-hidden="true"
                >
                  <title>
                    {buildPointTooltip(
                      xLabels[index],
                      value,
                      xTitle,
                      yTitle,
                      computedYMax
                    )}
                  </title>
                </rect>
              ))}
            </>
          ) : (
            values.map((value, index) => {
              const barTop = yScale(Math.max(value, computedYMin));
              const barHeight = chartHeight - barTop;
              const tooltip = buildPointTooltip(
                xLabels[index],
                value,
                xTitle,
                yTitle,
                computedYMax
              );
              return (
                <g key={index}>
                  <rect
                    x={index * slotWidth}
                    y={0}
                    width={slotWidth}
                    height={chartHeight}
                    className="ap-chart-hit"
                    aria-hidden="true"
                  >
                    <title>{tooltip}</title>
                  </rect>
                  <rect
                    x={index * slotWidth + slotWidth * 0.08}
                    y={barTop}
                    width={Math.max(slotWidth * 0.84, 0)}
                    height={Math.max(barHeight, 0)}
                    className="ap-chart-bar"
                    pointerEvents="none"
                  />
                </g>
              );
            })
          )}

          {xTicks.map((index) => (
            <text
              key={index}
              x={index * slotWidth + slotWidth / 2}
              y={chartHeight + 18}
              textAnchor="middle"
              className="ap-chart-tick"
            >
              {xLabels[index]}
            </text>
          ))}

          {yTitle ? (
            <text
              transform={`translate(${-44}, ${chartHeight / 2}) rotate(-90)`}
              textAnchor="middle"
              className="ap-chart-axis-title"
            >
              {yTitle}
            </text>
          ) : null}
          {xTitle ? (
            <text
              x={chartWidth / 2}
              y={chartHeight + 40}
              textAnchor="middle"
              className="ap-chart-axis-title"
            >
              {xTitle}
            </text>
          ) : null}
        </g>
      </svg>
    </figure>
  );
}

export default BarChart;
