import PropTypes from "prop-types";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FEEDBACK_TAG_MAX_COUNT,
  loadFeedbackTagVocab,
  tagOptionsForKind,
} from "../../lib/feedback/feedbackTagVocab";

function FeedbackTagPicker({
  kind,
  selectedTags = [],
  suggestedTags = [],
  onSelectedChange,
  onSuggestedChange,
  showSuggestField = true,
  disabled = false,
}) {
  const { t } = useTranslation();
  const suggestInputId = useId();
  const suggestFocusedRef = useRef(false);
  const [vocab, setVocab] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [suggestDraft, setSuggestDraft] = useState(
    () => (Array.isArray(suggestedTags) ? suggestedTags.join(", ") : ""),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadFeedbackTagVocab();
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setVocab(result.data);
      setLoadError("");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (suggestFocusedRef.current) {
      return;
    }
    setSuggestDraft(Array.isArray(suggestedTags) ? suggestedTags.join(", ") : "");
  }, [suggestedTags]);

  const options = useMemo(
    () => tagOptionsForKind(vocab, kind),
    [kind, vocab],
  );

  const toggleTag = (tagId) => {
    if (disabled || !onSelectedChange) {
      return;
    }
    const current = Array.isArray(selectedTags) ? [...selectedTags] : [];
    const index = current.indexOf(tagId);
    if (index >= 0) {
      current.splice(index, 1);
      onSelectedChange(current);
      return;
    }
    if (current.length >= FEEDBACK_TAG_MAX_COUNT) {
      return;
    }
    onSelectedChange([...current, tagId]);
  };

  const handleSuggestBlur = () => {
    suggestFocusedRef.current = false;
    if (!onSuggestedChange) {
      return;
    }
    const parts = suggestDraft
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2);
    onSuggestedChange(parts);
  };

  if (kind !== "bug" && kind !== "feature") {
    return null;
  }

  return (
    <div className="feedback-tag-picker">
      <p className="label">{t("feedback.tags.pickerLabel")}</p>
      <p className="feedback-muted feedback-field-hint">{t("feedback.tags.pickerHint", { max: FEEDBACK_TAG_MAX_COUNT })}</p>
      {loadError ? <p className="has-text-danger">{loadError}</p> : null}
      <div className="feedback-tag-picker-options" role="group" aria-label={t("feedback.tags.pickerLabel")}>
        {options.map((entry) => {
          const selected = selectedTags.includes(entry.id);
          return (
            <button
              key={entry.id}
              type="button"
              className={`button is-small apButtonNeutral feedback-tag-picker-option${selected ? " feedback-tag-picker-option--selected" : ""}`}
              disabled={disabled || (!selected && selectedTags.length >= FEEDBACK_TAG_MAX_COUNT)}
              aria-pressed={selected}
              onClick={() => toggleTag(entry.id)}
            >
              {t(`feedback.tag.${entry.id}`, { defaultValue: entry.id })}
            </button>
          );
        })}
      </div>
      {showSuggestField && onSuggestedChange ? (
        <div className="field feedback-tag-suggest">
          <label className="label" htmlFor={suggestInputId}>{t("feedback.tags.suggestLabel")}</label>
          <input
            id={suggestInputId}
            className="input"
            value={suggestDraft}
            disabled={disabled}
            placeholder={t("feedback.tags.suggestPlaceholder")}
            onChange={(e) => setSuggestDraft(e.target.value)}
            onFocus={() => {
              suggestFocusedRef.current = true;
            }}
            onBlur={handleSuggestBlur}
          />
          <p className="feedback-muted feedback-field-hint">{t("feedback.tags.suggestHint")}</p>
        </div>
      ) : null}
    </div>
  );
}

FeedbackTagPicker.propTypes = {
  kind: PropTypes.string.isRequired,
  selectedTags: PropTypes.arrayOf(PropTypes.string),
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  onSelectedChange: PropTypes.func,
  onSuggestedChange: PropTypes.func,
  showSuggestField: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default FeedbackTagPicker;
