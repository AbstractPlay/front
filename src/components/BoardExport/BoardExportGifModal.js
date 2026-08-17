import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Modal from "../Modal";

function BoardExportGifModal({
  show,
  onClose,
  onExport,
  pathFrames,
  busy,
  t,
}) {
  const [delaySec, setDelaySec] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  useEffect(() => {
    if (!show || !pathFrames?.length) return;
    setStartIndex(0);
    setEndIndex(pathFrames.length - 1);
    setDelaySec(1);
  }, [show, pathFrames]);

  if (!pathFrames?.length) {
    return null;
  }

  const frameCount = Math.max(0, endIndex - startIndex + 1);

  return (
    <Modal
      show={show}
      title={t("boardExport.gifTitle")}
      buttons={[
        {
          label: t("boardExport.export"),
          action: () =>
            onExport({
              delaySec: Number(delaySec),
              startPathIndex: Number(startIndex),
              endPathIndex: Number(endIndex),
            }),
          disabled: busy || frameCount < 1 || startIndex > endIndex,
        },
        {
          label: t("Cancel"),
          action: onClose,
        },
      ]}
    >
      <div className="content">
        <p className="is-size-7">{t("boardExport.gifHelp")}</p>
        <div className="field">
          <label className="label" htmlFor="board-export-delay">
            {t("boardExport.delayLabel")}
          </label>
          <div className="control">
            <input
              id="board-export-delay"
              className="input"
              type="number"
              min="0.1"
              step="0.1"
              value={delaySec}
              disabled={busy}
              onChange={(e) => setDelaySec(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="board-export-start">
            {t("boardExport.startLabel")}
          </label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                id="board-export-start"
                value={startIndex}
                disabled={busy}
                onChange={(e) => setStartIndex(Number(e.target.value))}
              >
                {pathFrames.map((frame) => (
                  <option key={`start-${frame.key}`} value={frame.index}>
                    {frame.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="board-export-end">
            {t("boardExport.endLabel")}
          </label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                id="board-export-end"
                value={endIndex}
                disabled={busy}
                onChange={(e) => setEndIndex(Number(e.target.value))}
              >
                {pathFrames.map((frame) => (
                  <option key={`end-${frame.key}`} value={frame.index}>
                    {frame.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <p className="is-size-7">
          {t("boardExport.frameCount", { count: frameCount })}
        </p>
      </div>
    </Modal>
  );
}

BoardExportGifModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  pathFrames: PropTypes.arrayOf(
    PropTypes.shape({
      index: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
    })
  ),
  busy: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default BoardExportGifModal;
