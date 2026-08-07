import React, { useState, useEffect, useMemo } from "react";
import { useStorageState } from "react-use-storage-state";
import { HexColorPicker, HexColorInput } from "react-colorful";
import Modal from "./Modal";
import { useTranslation } from "react-i18next";

const lightDefaults = {
  "--main-bg-color": "white",
  "--main-font-color": "black",
  "--secondary-font-color": "#333",
  "--main-heading-color": "#1a3e6f",
  "--main-fg-color": "#1a3e6f",
  "--bg-color2": "#999999",
  "--secondary-color-1": "#ff6633",
  "--secondary-color-1-lighter": "#ff8962",
  "--secondary-color-2": "#99cccc",
  "--secondary-color-3": "#008ca8",
  "--secondary-color-3-lighter": "#009fbf",
  "--secondary-color-3-bg": "#eefcff",
  "--tag-background-color": "#f5f5f5",
  "--svg-default-fill": "black",
  "--svg-volcano-caps": "black",
};

const darkDefaults = {
  "--main-bg-color": "#222",
  "--main-font-color": "#e6f2f2",
  "--secondary-font-color": "#c3d6f1",
  "--main-heading-color": "#008ca8",
  "--main-fg-color": "#009fbf",
  "--bg-color2": "#999999",
  "--secondary-color-1": "#ff6633",
  "--secondary-color-1-lighter": "#ff8962",
  "--secondary-color-2": "#99cccc",
  "--secondary-color-3": "#008ca8",
  "--secondary-color-3-lighter": "#009fbf",
  "--secondary-color-3-bg": "#333",
  "--tag-background-color": "#444",
  "--svg-default-fill": "var(--main-font-color)",
  "--svg-volcano-caps": "#888",
};

const customizableProperties = [
  "--main-bg-color",
  "--main-font-color",
  "--secondary-font-color",
  "--main-heading-color",
  "--main-fg-color",
  "--bg-color2",
  "--secondary-color-1",
  "--secondary-color-1-lighter",
  "--secondary-color-2",
  "--secondary-color-3",
  "--secondary-color-3-lighter",
  "--secondary-color-3-bg",
  "--tag-background-color",
  "--svg-default-fill",
  "--svg-volcano-caps",
];

function ThemeCustomizer({ show, handleClose }) {
  const { t } = useTranslation();
  const [colorMode, setColorMode] = useStorageState("color-mode", "light");
  const [customThemes, setCustomThemes] = useStorageState(
    "site-theme-customizations",
    { light: {}, dark: {} }
  );
  const [localCustomThemes, setLocalCustomThemes] = useState(customThemes);

  const [selectedVar, setSelectedVar] = useState(customizableProperties[0]);

  const currentThemeValues = useMemo(() => {
    const defaults = colorMode === "light" ? lightDefaults : darkDefaults;
    const customs = localCustomThemes[colorMode] || {};
    return { ...defaults, ...customs };
  }, [colorMode, localCustomThemes]);

  const [currentColor, setCurrentColor] = useState(
    currentThemeValues[selectedVar]
  );

  useEffect(() => {
    if (show) {
      setLocalCustomThemes(customThemes);
    }
  }, [show, customThemes]);

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
    handleClose();
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

  const previewWrapperStyle = useMemo(() => {
    const defaults = colorMode === "light" ? lightDefaults : darkDefaults;
    const customs = localCustomThemes[colorMode] || {};
    return { ...defaults, ...customs };
  }, [colorMode, localCustomThemes]);

  return (
    <Modal
      show={show}
      title={t("theme.title")}
      buttons={[
        { label: t("Save"), action: handleSave },
        { label: t("Close"), action: handleClose },
      ]}
    >
      <div className="columns">
        <div className="column">
          <div className="tabs is-toggle is-fullwidth">
            <ul>
              <li className={colorMode === "light" ? "is-active" : ""}>
                <a onClick={() => setColorMode("light")}>
                  {t("theme.lightMode")}
                </a>
              </li>
              <li className={colorMode === "dark" ? "is-active" : ""}>
                <a onClick={() => setColorMode("dark")}>
                  {t("theme.darkMode")}
                </a>
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
          <HexColorPicker color={currentColor} onChange={handleColorChange} />
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
                rows={10}
              ></textarea>
            </div>
          </div>
          <div className="buttons mt-4">
            <button className="button apButton" onClick={handleResetCurrent}>
              {t("theme.resetCurrent")}
            </button>
            <button className="button apButtonNeutral" onClick={handleReset}>
              {t("theme.resetBoth")}
            </button>
          </div>
        </div>
        <div className="column" style={previewWrapperStyle}>
          <h3 className="subtitle" style={{ color: "var(--main-font-color)" }}>
            {t("Preview")}
          </h3>
          <div
            style={{
              border: "1px solid var(--main-font-color)",
              padding: "1em",
              backgroundColor: "var(--main-bg-color)",
              color: "var(--main-font-color)",
            }}
          >
            <h1
              className="title"
              style={{ color: "var(--main-heading-color)" }}
            >
              {t("theme.sampleHeading")}
            </h1>
            <p>
              {t("theme.sampleText")}{" "}
              <a href="#" style={{ color: "var(--secondary-color-3)" }}>
                {t("theme.sampleLink")}
              </a>
            </p>
            <p style={{ color: "var(--secondary-font-color)" }}>
              {t("theme.secondaryFontColor")}
            </p>
            <div className="buttons">
              <button className="button apButton">
                {t("theme.primaryButton")}
              </button>
              <button className="button apButtonAlert">
                {t("theme.alertButton")}
              </button>
            </div>
            <div className="tags mt-2">
              <span
                className="tag"
                style={{
                  backgroundColor: "var(--tag-background-color)",
                  color: "var(--main-font-color)",
                }}
              >
                {t("theme.tag1")}
              </span>
              <span
                className="tag"
                style={{
                  backgroundColor: "var(--tag-background-color)",
                  color: "var(--main-font-color)",
                }}
              >
                {t("theme.tag2")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ThemeCustomizer;
