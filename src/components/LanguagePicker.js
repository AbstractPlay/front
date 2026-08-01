import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";

function LanguagePicker() {
  const { i18n, t } = useTranslation();

  return (
    <span className="language-picker">
      <LanguageSelect
        className="language-picker__select"
        id="footer-language-picker"
        ariaLabel={t("a11y.language")}
        value={i18n.resolvedLanguage}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      />
    </span>
  );
}

export default LanguagePicker;
