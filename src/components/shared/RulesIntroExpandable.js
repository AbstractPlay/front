import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Long rules blurb: full text always in the DOM, collapsed with fade until expanded
 * (same pattern as the player profile about section).
 */
export function RulesIntroExpandable({
  textKey,
  /** @deprecated use textKey */
  fullKey,
  expandKey = "Ladder.introExpand",
  collapseKey = "Ladder.introCollapse",
  collapsedMaxHeight = "6rem",
}) {
  const { t } = useTranslation();
  const resolvedKey = textKey ?? fullKey;
  const text = resolvedKey ? t(resolvedKey) : "";
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!text || /^\s*$/.test(text) || expanded) {
      setNeedsCollapse(false);
      return;
    }
    const el = contentRef.current;
    if (!el) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      setNeedsCollapse(el.scrollHeight > el.clientHeight + 2);
    });
    return () => cancelAnimationFrame(raf);
  }, [text, expanded, collapsedMaxHeight]);

  if (!text || /^\s*$/.test(text)) {
    return null;
  }

  const interactive = needsCollapse || expanded;

  const toggleExpanded = () => {
    setExpanded((v) => !v);
  };

  const bodyClassName = [
    "rules-intro-body",
    expanded ? "rules-intro-body--expanded" : "rules-intro-body--collapsed",
    !expanded && needsCollapse ? "rules-intro-body--fade" : null,
    interactive ? "rules-intro-body--interactive" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="content ladder-rules-intro mb-4">
      <div
        ref={contentRef}
        className={bodyClassName}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-expanded={interactive ? expanded : undefined}
        onClick={interactive ? toggleExpanded : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleExpanded();
                }
              }
            : undefined
        }
        style={
          expanded
            ? undefined
            : { maxHeight: collapsedMaxHeight }
        }
      >
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{text}</p>
      </div>
      {needsCollapse || expanded ? (
        <p className="has-text-centered rules-intro-toggle-wrap">
          <button
            type="button"
            className="button is-small is-text rules-intro-toggle"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
          >
            {expanded ? t(collapseKey) : t(expandKey)}
          </button>
        </p>
      ) : null}
    </div>
  );
}
