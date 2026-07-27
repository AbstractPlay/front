import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";

function LanguagePicker() {
  const { i18n } = useTranslation();

  return (
    <span className="language-picker">
      <LanguageSelect
        className="language-picker__select"
        id="footer-language-picker"
        ariaLabel="Language"
        value={i18n.resolvedLanguage}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      />
    </span>
  );
}

export default LanguagePicker;
