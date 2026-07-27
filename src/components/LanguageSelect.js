import React from "react";
import PropTypes from "prop-types";
import { SUPPORTED_LANGUAGES } from "../i18n";

function LanguageSelect({ id, value, onChange, className, ariaLabel }) {
  return (
    <select
      className={className}
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
    >
      {SUPPORTED_LANGUAGES.map(({ code, label }) => (
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
};

export default LanguageSelect;
