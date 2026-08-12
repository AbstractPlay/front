import React from "react";
import PropTypes from "prop-types";
import { SUPPORTED_LANGUAGES } from "../i18n";

function LanguageSelect({
  id,
  value,
  onChange,
  className,
  ariaLabel,
  languages = SUPPORTED_LANGUAGES,
}) {
  return (
    <select
      className={[className, "language-select"].filter(Boolean).join(" ")}
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
    >
      {languages.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}

LanguageSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  languages: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
};

export default LanguageSelect;
