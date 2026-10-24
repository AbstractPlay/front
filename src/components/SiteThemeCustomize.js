import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStorageState } from "react-use-storage-state";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import ThemeCustomizerPreview from "./ThemeCustomizerPreview";
import {
  customizableProperties,
  mergedThemeVars,
} from "../lib/siteThemeDefaults";
import "./theme-customizer.css";

function SiteThemeCustomize() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [colorMode, setColorMode] = useStorageState("color-mode", "light");
  const [customThemes, setCustomThemes] = useStorageState(
    "site-theme-customizations",
    { light: {}, dark: {} }
  );
  const [localCustomThemes, setLocalCustomThemes] = useState(customThemes);

  const [selectedVar, setSelectedVar] = useState(customizableProperties[0]);

  const currentThemeValues = useMemo(
    () => mergedThemeVars(colorMode, localCustomThemes),
    [colorMode, localCustomThemes]
  );

  const [currentColor, setCurrentColor] = useState(
    currentThemeValues[selectedVar]
  );

  useEffect(() => {
    setLocalCustomThemes(customThemes);
  }, [customThemes]);

  useEffect(() => {
    setCurrentColor(currentThemeValues[selectedVar]);
  }, [selectedVar, currentThemeValues]);

  const handleColorChange = (newColor) => {
    setCurrentColor(newColor);
    setLocalCustomThemes((prev) => {
      const newCustomThemes = { ...prev };
      if (!newCustomThemes[colorMode]) {
        newCustomThemes[colorMode] = {};
      }
      newCustomThemes[colorMode][selectedVar] = newColor;
      return newCustomThemes;
    });
  };

  const handleSave = () => {
    setCustomThemes(localCustomThemes);
    toast.success(t("theme.saved"));
  };

  const handleReset = () => {
    setLocalCustomThemes({ light: {}, dark: {} });
  };

  const handleResetCurrent = () => {
    setLocalCustomThemes((prev) => ({
      ...prev,
      [colorMode]: {},
    }));
  };

  const jsonString = useMemo(() => {
    return JSON.stringify(localCustomThemes, null, 2);
  }, [localCustomThemes]);

  const [jsonInput, setJsonInput] = useState(jsonString);

  useEffect(() => {
    setJsonInput(jsonString);
  }, [jsonString]);

  const handleJsonInputChange = (e) => {
    setJsonInput(e.target.value);
    try {
      setLocalCustomThemes(JSON.parse(e.target.value));
    } catch (err) {
      console.error("Error parsing json input:", err);
    }
  };

  const previewWrapperStyle = useMemo(
    () => mergedThemeVars(colorMode, localCustomThemes),
    [colorMode, localCustomThemes]
  );

  const isDirty = useMemo(
    () => JSON.stringify(localCustomThemes) !== JSON.stringify(customThemes),
    [localCustomThemes, customThemes]
  );

  return (
    <div className="container site-theme-page">
      <div className="site-theme-page__toolbar">
        <button
          type="button"
          className="button is-small"
          onClick={() => navigate(-1)}
        >
          <span className="icon">
            <i className="fa fa-arrow-left" aria-hidden="true"></i>
          </span>
          <span>{t("Back")}</span>
        </button>
        <div className="buttons site-theme-page__actions">
          <button
            type="button"
            className="button apButton"
            onClick={handleSave}
            disabled={!isDirty}
          >
            {t("Save")}
          </button>
        </div>
      </div>
      <h1 className="title">{t("theme.title")}</h1>
      <p className="help site-theme-page__intro">{t("theme.pageIntro")}</p>

      <div className="site-theme-page-layout">
        <div className="site-theme-page-editor">
          <div className="tabs is-toggle is-fullwidth">
            <ul>
              <li className={colorMode === "light" ? "is-active" : ""}>
                <button type="button" onClick={() => setColorMode("light")}>
                  {t("theme.lightMode")}
                </button>
              </li>
              <li className={colorMode === "dark" ? "is-active" : ""}>
                <button type="button" onClick={() => setColorMode("dark")}>
                  {t("theme.darkMode")}
                </button>
              </li>
            </ul>
          </div>
          <div className="field">
            <label className="label">{t("theme.cssVariable")}</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  value={selectedVar}
                  onChange={(e) => setSelectedVar(e.target.value)}
                >
                  {customizableProperties.map((prop) => (
                    <option key={prop} value={prop}>
                      {prop.replace("--", "").replace(/-/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <HexColorPicker
            color={currentColor}
            onChange={handleColorChange}
            className="site-theme-page__picker"
          />
          <HexColorInput
            color={currentColor}
            onChange={handleColorChange}
            prefixed
            className="input mt-3"
          />

          <div className="field mt-4">
            <label className="label">{t("theme.customizationsJson")}</label>
            <div className="control">
              <textarea
                className="textarea"
                value={jsonInput}
                onChange={handleJsonInputChange}
                rows={12}
              ></textarea>
            </div>
          </div>
          <div className="buttons mt-4">
            <button
              type="button"
              className="button apButtonNeutral"
              onClick={handleResetCurrent}
            >
              {t("theme.resetCurrent")}
            </button>
            <button
              type="button"
              className="button apButtonNeutral"
              onClick={handleReset}
            >
              {t("theme.resetBoth")}
            </button>
          </div>
        </div>
        <ThemeCustomizerPreview previewVars={previewWrapperStyle} />
      </div>
    </div>
  );
}

export default SiteThemeCustomize;
