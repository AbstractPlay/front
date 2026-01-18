function BoardNav({ currentIndex, total, onPrev, onNext }) {
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
        <button
          className="button is-small apButton"
          onClick={onPrev}
          disabled={currentIndex === 0}
        >
          <span className="icon">
            <i className="fa fa-chevron-left"></i>
          </span>
        </button>
      </div>

      <div className="level-item has-text-centered">
        <p>
          Frame <strong>{currentIndex + 1}</strong> of <strong>{total}</strong>
        </p>
      </div>

      <div className="level-right">
        <button
          className="button is-small apButton"
          onClick={onNext}
          disabled={currentIndex === total - 1}
        >
          <span className="icon">
            <i className="fa fa-chevron-right"></i>
          </span>
        </button>
      </div>
    </nav>
  );
}

export default BoardNav;
