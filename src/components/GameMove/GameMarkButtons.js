import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

function MarkIconButton({
  title,
  active,
  onClick,
  iconClass,
  activeIconClass,
}) {
  return (
    <div className="control">
      <button
        className="button is-small apButton"
        onClick={onClick}
        title={title}
        type="button"
      >
        <span className="icon">
          {active ? (
            <span className="highlight">
              <i className={`fa ${activeIconClass || iconClass}`}></i>
            </span>
          ) : (
            <i className={`fa ${iconClass}`}></i>
          )}
        </span>
      </button>
    </div>
  );
}

function GameMarkButtons({
  screenWidth,
  showWatch,
  showHighlight,
  showRecommend,
  watching,
  highlighted,
  recommended,
  onWatch,
  onHighlight,
  onRecommend,
  busy,
}) {
  const { t } = useTranslation();
  const [menuOpen, menuOpenSetter] = useState(false);
  const menuRef = useRef(null);
  const compact = screenWidth < 770;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        menuOpenSetter(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const items = [];
  if (showWatch) {
    items.push({
      key: "watch",
      title: watching ? t("gameMarks.unwatch") : t("gameMarks.watch"),
      active: watching,
      iconClass: watching ? "fa-eye-slash" : "fa-eye",
      onClick: onWatch,
    });
  }
  if (showHighlight) {
    items.push({
      key: "highlight",
      title: highlighted
        ? t("gameMarks.unhighlight")
        : t("gameMarks.highlight"),
      active: highlighted,
      iconClass: highlighted ? "fa-bookmark" : "fa-bookmark-o",
      onClick: onHighlight,
    });
  }
  if (showRecommend) {
    items.push({
      key: "recommend",
      title: recommended
        ? t("gameMarks.unrecommend")
        : t("gameMarks.recommend"),
      active: recommended,
      iconClass: recommended ? "fa-thumbs-up" : "fa-thumbs-o-up",
      onClick: onRecommend,
    });
  }

  if (items.length === 0) return null;

  if (compact) {
    return (
      <div className="control" ref={menuRef} style={{ position: "relative" }}>
        <button
          className="button is-small apButton"
          onClick={() => menuOpenSetter((v) => !v)}
          title={t("gameMarks.moreActions")}
          type="button"
          disabled={busy}
        >
          <span className="icon">
            <i className="fa fa-ellipsis-h"></i>
          </span>
        </button>
        {menuOpen ? (
          <div
            className="dropdown-menu"
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              top: "100%",
              zIndex: 20,
              minWidth: "10rem",
              backgroundColor: "var(--main-bg-color)",
              border: "1px solid var(--bg-color2)",
              borderRadius: "4px",
              padding: "0.25rem 0",
            }}
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                className="dropdown-item"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.35rem 0.75rem",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--main-fg-color)",
                }}
                onClick={() => {
                  menuOpenSetter(false);
                  item.onClick();
                }}
              >
                <span
                  className="icon is-small"
                  style={{ marginRight: "0.35rem" }}
                >
                  <i className={`fa ${item.iconClass}`}></i>
                </span>
                {item.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {items.map((item) => (
        <MarkIconButton
          key={item.key}
          title={item.title}
          active={item.active}
          iconClass={item.iconClass}
          onClick={item.onClick}
        />
      ))}
    </>
  );
}

export default GameMarkButtons;
