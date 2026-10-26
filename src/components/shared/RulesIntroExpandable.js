import { useState } from "react";
import { useTranslation } from "react-i18next";
import ExpandableDiv from "../ExpandableDiv";

/**
 * Short rules blurb with fade + expand (click to read full text).
 */
export function RulesIntroExpandable({ summaryKey, fullKey, numLines = 3 }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const summary = t(summaryKey);
  const full = t(fullKey);
  if (!summary && !full) {
    return null;
  }
  const body = expanded ? full || summary : summary || full;
  return (
    <div className="content ladder-rules-intro mb-4">
      <ExpandableDiv
        expanded={expanded}
        numLines={numLines}
        handleClick={() => setExpanded((v) => !v)}
      >
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{body}</p>
      </ExpandableDiv>
      <button
        type="button"
        className="button is-small apButtonNeutral mt-1"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? t("Ladder.introCollapse") : t("Ladder.introExpand")}
      </button>
    </div>
  );
}
