/** Keep in sync with :root[color-mode] tokens in src/index.css */

export const lightDefaults = {
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

export const darkDefaults = {
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

export const customizableProperties = [
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

export function mergedThemeVars(colorMode, customizations = {}) {
  const defaults = colorMode === "light" ? lightDefaults : darkDefaults;
  const customs = customizations[colorMode] || {};
  return { ...defaults, ...customs };
}
