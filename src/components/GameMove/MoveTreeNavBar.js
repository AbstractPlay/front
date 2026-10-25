import MoveTreeNavButton from "./MoveTreeNavButton";

/**
 * Grouped move-tree navigation (play + Lab). Handlers and disabled state come from parent.
 * Groups: jump to start/end | variation | prev/next step.
 */
function MoveTreeNavBar({
  t,
  neverExplore = false,
  skeleton = false,
  showDensityToggle = false,
  densityTooltip,
  onDensityClick,
  onBegin,
  onPrev,
  onPrevVar,
  onNextVar,
  onNext,
  onCurrent,
  prevDisabled,
  nextDisabled,
  prevVarDisabled,
  nextVarDisabled,
  currentDisabled,
}) {
  const noop = undefined;

  return (
    <nav
        id="MoveTreeBtnBar"
        className="move-tree-nav field is-grouped"
        aria-label={t("Moves")}
      >
        <div className="move-tree-nav__group move-tree-nav__group--jump">
          <MoveTreeNavButton
            t={t}
            labelKey="GoBegin"
            iconClass="fa-angle-double-left"
            disabled={skeleton}
            onClick={skeleton ? noop : onBegin}
          />
          <MoveTreeNavButton
            t={t}
            labelKey="GoCurrent"
            iconClass="fa-angle-double-right"
            disabled={skeleton || currentDisabled}
            onClick={skeleton ? noop : onCurrent}
          />
        </div>
        {neverExplore ? null : (
          <div className="move-tree-nav__group move-tree-nav__group--var">
            <MoveTreeNavButton
              t={t}
              labelKey="GoPrevVar"
              iconClass="fa-angle-up"
              disabled={skeleton || prevVarDisabled}
              onClick={skeleton ? noop : onPrevVar}
            />
            <MoveTreeNavButton
              t={t}
              labelKey="GoNextVar"
              iconClass="fa-angle-down"
              disabled={skeleton || nextVarDisabled}
              onClick={skeleton ? noop : onNextVar}
            />
          </div>
        )}
        <div className="move-tree-nav__group move-tree-nav__group--step">
          <MoveTreeNavButton
            t={t}
            labelKey="GoPrev"
            iconClass="fa-angle-left"
            disabled={skeleton || prevDisabled}
            onClick={skeleton ? noop : onPrev}
          />
          <MoveTreeNavButton
            t={t}
            labelKey="GoNext"
            iconClass="fa-angle-right"
            disabled={skeleton || nextDisabled}
            onClick={skeleton ? noop : onNext}
          />
        </div>
        {showDensityToggle ? (
          <div className="move-tree-nav__group move-tree-nav__group--density">
            <button
              className="button is-small tooltipped move-tree-nav__btn"
              type="button"
              onClick={onDensityClick}
              aria-label={densityTooltip}
            >
              <i className="fa fa-th" aria-hidden="true"></i>
              <span className="tooltiptext">{densityTooltip}</span>
            </button>
          </div>
        ) : null}
    </nav>
  );
}

export default MoveTreeNavBar;
