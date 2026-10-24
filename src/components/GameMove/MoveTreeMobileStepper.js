import { useEffect } from "react";
import { createPortal } from "react-dom";

const BODY_ACTIVE_CLASS = "move-tree-mobile-stepper-active";

function MoveTreeMobileStepper({
  t,
  positionIndex,
  positionTotal,
  prevDisabled,
  nextDisabled,
  onPrev,
  onNext,
}) {
  const positionLabel =
    positionTotal > 0 ? `${positionIndex} / ${positionTotal}` : "—";

  useEffect(() => {
    document.body.classList.add(BODY_ACTIVE_CLASS);
    return () => {
      document.body.classList.remove(BODY_ACTIVE_CLASS);
    };
  }, []);

  const bar = (
    <div
      className="move-tree-mobile-stepper"
      role="toolbar"
      aria-label={t("Moves")}
    >
      <button
        type="button"
        className="button apButtonNeutral move-tree-mobile-stepper__btn"
        disabled={prevDisabled}
        onClick={onPrev}
        aria-label={t("GoPrev")}
      >
        <span className="icon">
          <i className="fa fa-angle-left" aria-hidden="true"></i>
        </span>
      </button>
      <span
        className="move-tree-mobile-stepper__position"
        aria-live="polite"
        aria-atomic="true"
      >
        {positionLabel}
      </span>
      <button
        type="button"
        className="button apButtonNeutral move-tree-mobile-stepper__btn"
        disabled={nextDisabled}
        onClick={onNext}
        aria-label={t("GoNext")}
      >
        <span className="icon">
          <i className="fa fa-angle-right" aria-hidden="true"></i>
        </span>
      </button>
    </div>
  );

  return createPortal(bar, document.body);
}

export default MoveTreeMobileStepper;
