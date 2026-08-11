import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import { getPickerLanguage } from "../i18n";

function LanguagePicker() {
  const { i18n, t } = useTranslation();

  return (
    <span className="language-picker">
      <LanguageSelect
        className="language-picker__select"
        id="footer-language-picker"
        ariaLabel={t("a11y.language")}
        value={getPickerLanguage(i18n)}
        onChange={(e) => {
          void i18n.changeLanguage(e.target.value).catch((err) => {
            console.error("i18n.changeLanguage failed:", err);
          });
        }}
      />
    </span>
  );
}

export default LanguagePicker;
