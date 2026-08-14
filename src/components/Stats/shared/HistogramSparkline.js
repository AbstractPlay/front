import React from "react";
import Plot from "react-plotly.js";
import Modal from "../../Modal";
import { useTranslation } from "react-i18next";
import { PLOTLY_CONFIG } from "./plotlyLayout";

function HistogramSparkline({
  rowId,
  histShort,
  histogram,
  histMax,
  modalTitle,
  isOpen,
  onOpen,
  onClose,
}) {
  const { t } = useTranslation();
  const scaleMax =
    histMax ?? (histogram.length > 0 ? Math.max(...histogram) : 1);
  const safeMax = scaleMax > 0 ? scaleMax : 1;

  return (
    <>
      <div
        className="stats-histogram-sparkline"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <ul className="miniChart" key={rowId}>
          {histShort.map((n, i) => (
            <li key={`${rowId}|${i}`}>
              <span style={{ height: `${(n / safeMax) * 100}%` }}></span>
            </li>
          ))}
        </ul>
      </div>
      <Modal
        buttons={[{ label: t("Close"), action: onClose }]}
        show={isOpen}
        title={modalTitle}
      >
        <div style={{ overflow: "hidden" }}>
          <Plot
            data={[{ y: [...histogram], type: "bar" }]}
            config={{ ...PLOTLY_CONFIG, displayModeBar: false }}
            layout={{
              xaxis: { title: t("stats.siteStats.weekNumber") },
              yaxis: { title: t("stats.siteStats.completedGames") },
              margin: { r: 160 },
            }}
          />
        </div>
      </Modal>
    </>
  );
}

export default HistogramSparkline;
