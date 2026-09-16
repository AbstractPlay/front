import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

function FeedbackQuickSearch({ value, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="field feedback-quick-search">
      <label className="label" htmlFor="feedback-quick-search-input">
        {t("feedback.search.label")}
      </label>
      <div className="control">
        <input
          id="feedback-quick-search-input"
          type="search"
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("feedback.search.placeholder")}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

FeedbackQuickSearch.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default FeedbackQuickSearch;
