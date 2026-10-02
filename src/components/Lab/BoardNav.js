function BoardNav({
  currentIndex,
  total,
  onFirst,
  onPrev,
  onNext,
  onLast,
  t,
}) {
  const atFirst = currentIndex === 0;
  const atLast = currentIndex === total - 1;

  return (
    <nav
      className="level"
      style={{
        marginTop: "1rem",
        border: "1px solid var(--main-font-color)",
        borderRadius: "6px",
        padding: "0.5rem",
      }}
    >
      <div className="level-left">
        <div className="level-item">
          <div className="buttons are-small">
            <button
              type="button"
              className="button apButton"
              onClick={onFirst}
              disabled={atFirst}
              aria-label={t("gameMove.boardNav.jumpToFirst")}
            >
              <span className="icon">
                <i className="fa fa-angle-double-left" aria-hidden="true"></i>
              </span>
            </button>
            <button
              type="button"
              className="button apButton"
              onClick={onPrev}
              disabled={atFirst}
              aria-label={t("gameMove.boardNav.previousFrame")}
            >
              <span className="icon">
                <i className="fa fa-chevron-left" aria-hidden="true"></i>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="level-item has-text-centered">
        <p>
          Frame <strong>{currentIndex + 1}</strong> of <strong>{total}</strong>
        </p>
      </div>

      <div className="level-right">
        <div className="level-item">
          <div className="buttons are-small">
            <button
              type="button"
              className="button apButton"
              onClick={onNext}
              disabled={atLast}
              aria-label={t("gameMove.boardNav.nextFrame")}
            >
              <span className="icon">
                <i className="fa fa-chevron-right" aria-hidden="true"></i>
              </span>
            </button>
            <button
              type="button"
              className="button apButton"
              onClick={onLast}
              disabled={atLast}
              aria-label={t("gameMove.boardNav.jumpToLast")}
            >
              <span className="icon">
                <i className="fa fa-angle-double-right" aria-hidden="true"></i>
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default BoardNav;
