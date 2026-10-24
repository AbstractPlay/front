function MoveTreeNavButton({
  t,
  labelKey,
  iconClass,
  disabled = false,
  onClick,
  extraClassName = "",
}) {
  return (
    <button
      type="button"
      className={`button is-small tooltipped move-tree-nav__btn ${extraClassName}`.trim()}
      disabled={disabled}
      onClick={onClick}
      aria-label={t(labelKey)}
    >
      <i className={`fa ${iconClass}`} aria-hidden="true"></i>
      <span className="tooltiptext">{t(labelKey)}</span>
    </button>
  );
}

export default MoveTreeNavButton;
