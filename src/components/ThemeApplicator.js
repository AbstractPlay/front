import { useEffect } from "react";
import { useStorageState } from "react-use-storage-state";

function ThemeApplicator() {
  const [customThemes] = useStorageState("site-theme-customizations", {
    light: {},
    dark: {},
  });

  useEffect(() => {
    const styleElId = "custom-theme-styles";
    let styleEl = document.getElementById(styleElId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleElId;
      document.head.appendChild(styleEl);
    }

    const lightCustomizations = Object.entries(customThemes.light)
      .map(([key, val]) => `${key}: ${val};`)
      .join("\n");
    const darkCustomizations = Object.entries(customThemes.dark)
      .map(([key, val]) => `${key}: ${val};`)
      .join("\n");

    styleEl.innerHTML = `
            :root[color-mode="light"] {
                ${lightCustomizations}
            }
            :root[color-mode="dark"] {
                ${darkCustomizations}
            }
        `;
    // No cleanup function needed if we want styles to persist
  }, [customThemes]);

  return null;
}

export default ThemeApplicator;
