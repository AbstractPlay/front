import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { HexColorPicker, HexColorInput } from "react-colorful";
import {
  render,
  renderglyph,
  sheets,
  isBoardChromeEligible,
  getCompatibleStyles,
} from "@abstractplay/renderer";
import { gameinfo } from "@abstractplay/gameslib";
import { callAuthApi } from "../lib/api";
import { coloursEqual, resolveCustomizePreviewPalette } from "../lib/resolveEffectivePalette.js";
import { shouldImportLegacyCustomCss } from "../lib/resolveEffectiveCustomCss.js";
import {
  applyRenderSettingsToOptions,
  prepareBoardRender,
} from "../lib/prepareBoardRender.js";
import {
  buildRenderCustomization,
  clearBoardRenderUi,
  coerceLabelScale,
  LABEL_SCALE_SLIDER_MAX,
  LABEL_SCALE_SLIDER_MIN,
  LABEL_SCALE_SLIDER_STEP,
  isRenderSettingsWithinSizeLimit,
  preflightRenderCustomization,
  RENDER_OPTION_WHITELIST,
  renderUiStateFromSettings,
  stripBoardStyleForGlobalRender,
} from "../lib/customizeRenderSettings.js";
import { normalizeCustomizationSettings } from "../lib/normalizeCustomizationSettings.js";
import { useStore } from "../stores";
import { isEqual, cloneDeep, debounce } from "lodash";
import { useTranslation, Trans } from "react-i18next";
import { useStorageState } from "react-use-storage-state";
import ApplyCustomizationModal from "./ApplyCustomizationModal";
const patternNames = [
  "microbial",
  "chevrons",
  "honeycomb",
  "triangles",
  "wavy",
  "slant",
  "dots",
  "starsWhite",
  "cross",
  "houndstooth",
];

const isPatternName = (value) =>
  typeof value === "string" && patternNames.includes(value);

const swatchButtonStyle = {
  width: "20px",
  height: "20px",
  padding: 0,
  lineHeight: 0,
};

function CustomizeCollapsibleSection({
  id,
  title,
  open,
  onToggle,
  tags = null,
  children,
}) {
  return (
    <section style={{ marginTop: "1.25em", marginBottom: "1.25em" }}>
      <button
        type="button"
        id={`${id}-heading`}
        className="customize-collapsible-heading"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          width: "100%",
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          color: "inherit",
        }}
      >
        <span className="icon is-small" style={{ opacity: 0.65 }} aria-hidden="true">
          <i className={`fa fa-chevron-${open ? "down" : "right"}`} />
        </span>
        <h2 className="subtitle" style={{ margin: 0, flex: "1 1 auto" }}>
          {title}
        </h2>
        {tags ? (
          <span
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.35em",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {tags}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-heading`}
          style={{ marginTop: "0.75em" }}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

function ColourSwatchButton({ color, onClick, title, selected = false }) {
  return (
    <button
      type="button"
      className="button is-small"
      title={title}
      aria-pressed={selected}
      style={{
        ...swatchButtonStyle,
        backgroundColor: color,
        ...(selected
          ? {
              boxShadow:
                "0 0 0 2px var(--main-bg-color), 0 0 0 4px var(--secondary-color-3)",
            }
          : {}),
      }}
      onClick={onClick}
    >
      &nbsp;
    </button>
  );
}

function renderPatternGlyph(patternName, idPrefix) {
  return renderglyph("piece", patternName, {
    prefix: `${idPrefix}-${patternName}-`,
  });
}

function patternSwatchDataUri(patternName, idPrefix) {
  const svg = renderPatternGlyph(patternName, idPrefix);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function PatternSwatchButton({ patternName, onClick }) {
  const src = useMemo(
    () => patternSwatchDataUri(patternName, "swatch"),
    [patternName]
  );
  return (
    <button
      className="button is-small"
      title={patternName}
      style={{ ...swatchButtonStyle, overflow: "hidden", padding: 0 }}
      onClick={onClick}
    >
      <img
        src={src}
        alt={patternName}
        style={{ display: "block", width: "20px", height: "20px" }}
      />
    </button>
  );
}

function PatternGlyphPreview({ patternName, size = 16 }) {
  const src = useMemo(
    () => patternSwatchDataUri(patternName, "palette-tag"),
    [patternName]
  );
  return (
    <img
      src={src}
      alt={patternName}
      style={{
        display: "block",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    />
  );
}

function Customize(props) {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const providedMetaGame = props.metaGame || params.metaGame;
  const [scope, setScope] = useState("game");
  const metaGame =
    scope === "global" || !providedMetaGame ? "_default" : providedMetaGame;
  const isGlobalCustomization = metaGame === "_default";
  const inJSON = props.inJSON || location.state?.inJSON;
  const defaultRendererJson = useMemo(
    () =>
      JSON.stringify(
        {
          board: { style: "squares-checkered", width: 4, height: 4 },
          legend: {
            A: { name: "piece", colour: 1 },
            B: { name: "piece", colour: 2 },
            C: { name: "piece", colour: 3 },
            D: { name: "piece", colour: 4 },
          },
          pieces: "AABB\nA--B\nD--C\nDDCC",
        },
        null,
        2
      ),
    []
  );

  const normalizeData = (input) => {
    try {
      let data = typeof input === "string" ? JSON.parse(input) : input;
      // Handle potential double stringification
      if (typeof data === "string") data = JSON.parse(data);
      // Recursively pick the last item if it's an array
      while (Array.isArray(data) && data.length > 0) {
        data = data[data.length - 1];
      }
      return data ? JSON.stringify(data, null, 2) : null;
    } catch (e) {
      return null;
    }
  };

  const [rendererJson, setRendererJson] = useState(() => {
    const normalized = normalizeData(inJSON);
    return normalized ?? defaultRendererJson;
  });

  useEffect(() => {
    if (inJSON !== undefined && inJSON !== null) {
      const normalized = normalizeData(inJSON);
      setRendererJson(normalized ?? defaultRendererJson);
    } else if (metaGame === "_default") {
      setRendererJson(defaultRendererJson);
    } else {
      fetch(`https://thumbnails.abstractplay.com/${metaGame}.json`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data) => {
          const normalized = normalizeData(data);
          setRendererJson(normalized ?? defaultRendererJson);
        })
        .catch(() => {
          setRendererJson(defaultRendererJson);
        });
    }
  }, [metaGame, inJSON, defaultRendererJson]);

  const [gameName, setGameName] = useState("");
  const globalMe = useStore((state) => state.globalMe);
  const setGlobalMe = useStore((state) => state.setGlobalMe);
  const globalColourContext = useStore((state) => state.colourContext);

  // Context state
  const [background, setBackground] = useState("#ffffff");
  const [board, setBoard] = useState("#ffffff");
  const [strokes, setStrokes] = useState("#000000");
  const [borders, setBorders] = useState("#000000");
  const [labels, setLabels] = useState("#000000");
  const [annotations, setAnnotations] = useState("#000000");
  const [fill, setFill] = useState("#000000");

  // Palette state
  const [palette, setPalette] = useState([]);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [preferredColour, setPreferredColour] = useState(null);
  const [preferredColourOpen, setPreferredColourOpen] = useState(false);

  // Glyph mapping state
  const [glyphMap, setGlyphMap] = useState([]);
  const [boardStyle, setBoardStyle] = useState("");
  const [strokeWeight, setStrokeWeight] = useState("");
  const [labelScale, setLabelScale] = useState(1);
  const [renderOptions, setRenderOptions] = useState([]);
  const [selectedOriginalGlyph, setSelectedOriginalGlyph] = useState("");
  const [selectedSheet, setSelectedSheet] = useState("core");
  const [selectedReplacementGlyph, setSelectedReplacementGlyph] = useState("");
  const [selectedScale, setSelectedScale] = useState("1");

  const [customCssText, setCustomCssText] = useState("");
  const [customCssActive, setCustomCssActive] = useState(true);
  const [customCssOpen, setCustomCssOpen] = useState(false);
  const [renderSectionOpen, setRenderSectionOpen] = useState(false);
  const [importedLegacyCss, setImportedLegacyCss] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [legacyCustomCSS, legacyCustomCSSSetter] = useStorageState(
    "custom-css",
    {}
  );

  const presetColors = [
    "#e31a1c",
    "#1f78b4",
    "#33a02c",
    "#ffff99",
    "#6a3d9a",
    "#ff7f00",
    "#b15928",
    "#fb9a99",
    "#a6cee3",
    "#b2df8a",
    "#fdbf6f",
    "#cab2d6",
  ];

  const colorBlindColors = [
    "#9f0162",
    "#8400cd",
    "#a40122",
    "#009f81",
    "#008df9",
    "#e20134",
    "#ff5aaf",
    "#00c2f9",
    "#ff6e3a",
    "#00fccf",
    "#ffb2fd",
    "#ffc33b",
  ];

  const contextProps = useMemo(
    () => [
      {
        label: t("customize.context.background.label"),
        value: "background",
        help: t("customize.context.background.help"),
      },
      {
        label: t("customize.context.board.label"),
        value: "board",
        help: t("customize.context.board.help"),
      },
      {
        label: t("customize.context.strokes.label"),
        value: "strokes",
        help: t("customize.context.strokes.help"),
      },
      {
        label: t("customize.context.borders.label"),
        value: "borders",
        help: t("customize.context.borders.help"),
      },
      {
        label: t("customize.context.labels.label"),
        value: "labels",
        help: t("customize.context.labels.help"),
      },
      {
        label: t("customize.context.annotations.label"),
        value: "annotations",
        help: t("customize.context.annotations.help"),
      },
      {
        label: t("customize.context.fill.label"),
        value: "fill",
        help: t("customize.context.fill.help"),
      },
    ],
    [t]
  );
  const [selectedContextProp, setSelectedContextProp] = useState("background");

  const customizationHints = useMemo(() => {
    if (!metaGame || metaGame === "_default") return [];
    const info = gameinfo.get(metaGame);
    return info?.customizations || [];
  }, [metaGame]);

  const contextHints = useMemo(() => {
    return customizationHints.filter((h) => "name" in h);
  }, [customizationHints]);

  const paletteHints = useMemo(() => {
    return customizationHints.filter((h) => "num" in h);
  }, [customizationHints]);

  const previewColours = useMemo(
    () =>
      resolveCustomizePreviewPalette({
        palette,
        preferredColour,
        metaGame,
        customizationHints,
      }),
    [palette, preferredColour, metaGame, customizationHints]
  );

  const applySettingsToRenderUi = (settings, previewRepForSeed = null) => {
    const ui = renderUiStateFromSettings(settings, previewRepForSeed);
    setGlyphMap(ui.glyphMap);
    setBoardStyle(isGlobalCustomization ? "" : ui.boardStyle);
    setStrokeWeight(ui.strokeWeight);
    setLabelScale(ui.labelScale);
    setRenderOptions(ui.renderOptions);
  };

  const toggleRenderOption = (optionKey) => {
    setRenderOptions((prev) =>
      prev.includes(optionKey)
        ? prev.filter((k) => k !== optionKey)
        : [...prev, optionKey].sort(
            (a, b) =>
              RENDER_OPTION_WHITELIST.indexOf(a) -
              RENDER_OPTION_WHITELIST.indexOf(b),
          ),
    );
    setIsDirty(true);
  };

  const renderCustomization = useMemo(() => {
    const built = buildRenderCustomization({
      boardStyle,
      strokeWeight,
      labelScale,
      renderOptions,
      glyphMap,
    });
    return isGlobalCustomization
      ? stripBoardStyleForGlobalRender(built)
      : built;
  }, [
    boardStyle,
    strokeWeight,
    labelScale,
    renderOptions,
    glyphMap,
    isGlobalCustomization,
  ]);

  const previewRep = useMemo(() => {
    try {
      return JSON.parse(rendererJson);
    } catch {
      return null;
    }
  }, [rendererJson]);

  const boardChromeEligible = Boolean(
    previewRep && isBoardChromeEligible(previewRep),
  );

  const compatibleBoardStyles = useMemo(() => {
    const base = previewRep?.board?.style;
    if (!base) {
      return [];
    }
    return getCompatibleStyles(String(base));
  }, [previewRep]);

  const renderPreflight = useMemo(() => {
    if (!previewRep) {
      return { ok: true, errors: [], warnings: [] };
    }
    return preflightRenderCustomization(previewRep, renderCustomization);
  }, [previewRep, renderCustomization]);

  const settingsJson = useMemo(() => {
    const settings = {
      colourContext: {
        background,
        board,
        strokes,
        borders,
        labels,
        annotations,
        fill,
      },
      palette,
    };
    if (preferredColour) {
      settings.preferredColour = preferredColour;
    }
    if (customCssText.trim()) {
      settings.customCss = { css: customCssText, active: customCssActive };
    }
    if (renderCustomization) {
      settings.render = renderCustomization;
    }
    return JSON.stringify(settings, null, 2);
  }, [
    background,
    board,
    strokes,
    borders,
    labels,
    annotations,
    fill,
    palette,
    preferredColour,
    customCssText,
    customCssActive,
    renderCustomization,
  ]);

  const [settingsInput, setSettingsInput] = useState(settingsJson);
  const [isDirty, setIsDirty] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const firstUpdate = useRef(true);

  useEffect(() => {
    if (globalMe?.customizations?.[metaGame]) {
      const settings = globalMe.customizations[metaGame];
      if (settings.colourContext) {
        if (settings.colourContext.background)
          setBackground(settings.colourContext.background);
        if (settings.colourContext.board)
          setBoard(settings.colourContext.board);
        else if (settings.colourContext.background)
          setBoard(settings.colourContext.background);
        if (settings.colourContext.strokes)
          setStrokes(settings.colourContext.strokes);
        if (settings.colourContext.borders)
          setBorders(settings.colourContext.borders);
        if (settings.colourContext.labels)
          setLabels(settings.colourContext.labels);
        if (settings.colourContext.annotations)
          setAnnotations(settings.colourContext.annotations);
        if (settings.colourContext.fill) setFill(settings.colourContext.fill);
      }
      setPalette(settings.palette || []);
      applySettingsToRenderUi(settings, previewRep);
      setPreferredColour(settings.preferredColour || null);
      if (settings.customCss) {
        setCustomCssText(settings.customCss.css ?? "");
        setCustomCssActive(settings.customCss.active !== false);
      } else {
        setCustomCssText("");
        setCustomCssActive(true);
      }
    } else if (globalMe?.customizations?._default) {
      const settings = globalMe.customizations._default;
      const sys_ctx = globalColourContext || {};
      const ctx = settings.colourContext || {};
      setBackground(ctx.background || sys_ctx.background);
      setBoard(
        ctx.board || ctx.background || sys_ctx.board || sys_ctx.background
      );
      setStrokes(ctx.strokes || sys_ctx.strokes);
      setBorders(ctx.borders || sys_ctx.borders);
      setLabels(ctx.labels || sys_ctx.labels);
      setAnnotations(ctx.annotations || sys_ctx.annotations);
      setFill(ctx.fill || sys_ctx.fill);
      setPalette(settings.palette || []);
      applySettingsToRenderUi(settings, previewRep);
      setPreferredColour(settings.preferredColour || null);
      if (settings.customCss) {
        setCustomCssText(settings.customCss.css ?? "");
        setCustomCssActive(settings.customCss.active !== false);
      } else {
        setCustomCssText("");
        setCustomCssActive(true);
      }
    } else if (globalColourContext) {
      if (globalColourContext.background)
        setBackground(globalColourContext.background);
      if (globalColourContext.board) setBoard(globalColourContext.board);
      else if (globalColourContext.background)
        setBoard(globalColourContext.background);
      if (globalColourContext.strokes) setStrokes(globalColourContext.strokes);
      if (globalColourContext.borders) setBorders(globalColourContext.borders);
      if (globalColourContext.labels) setLabels(globalColourContext.labels);
      if (globalColourContext.annotations)
        setAnnotations(globalColourContext.annotations);
      if (globalColourContext.fill) setFill(globalColourContext.fill);
      setPalette([]);
      applySettingsToRenderUi({}, previewRep);
      setPreferredColour(null);
      setCustomCssText("");
      setCustomCssActive(true);
    }
    setImportedLegacyCss(false);
  }, [globalMe, metaGame, globalColourContext, previewRep]);

  useEffect(() => {
    if (!previewRep) {
      return;
    }
    const settings = globalMe?.customizations?.[metaGame];
    const norm = normalizeCustomizationSettings(settings);
    const hasSavedOptions =
      Array.isArray(norm.options) && norm.options.length > 0;
    if (!hasSavedOptions) {
      const ui = renderUiStateFromSettings(settings ?? {}, previewRep);
      setRenderOptions(ui.renderOptions);
    }
  }, [previewRep, metaGame, globalMe?.customizations]);

  useEffect(() => {
    if (
      scope !== "game" ||
      !providedMetaGame ||
      providedMetaGame === "_default" ||
      !legacyCustomCSS
    ) {
      return;
    }
    const localEntry = legacyCustomCSS[providedMetaGame];
    if (
      shouldImportLegacyCustomCss(globalMe, providedMetaGame, localEntry)
    ) {
      setCustomCssText(localEntry.css ?? "");
      setCustomCssActive(localEntry.active !== false);
      setImportedLegacyCss(true);
      setIsDirty(true);
      setCustomCssOpen(true);
    }
  }, [
    scope,
    providedMetaGame,
    legacyCustomCSS,
    globalMe,
    metaGame,
  ]);

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    if (
      globalMe?.customizations?.[metaGame] &&
      isEqual(JSON.parse(settingsJson), globalMe.customizations[metaGame])
    ) {
      setIsDirty(false);
    } else {
      setIsDirty(true);
    }
    setSettingsInput(settingsJson);
  }, [settingsJson, globalMe, metaGame]);

  useEffect(() => {
    if (metaGame !== undefined && metaGame !== null && metaGame !== "") {
      if (metaGame === "_default") {
        setGameName(t("customize.globalDefaults"));
      } else {
        setGameName(gameinfo.get(metaGame)?.name || metaGame);
      }
    } else {
      setGameName("");
    }
  }, [metaGame, t]);

  const debouncedSetError = useMemo(() => debounce(setSettingsError, 500), []);

  const handleSettingsChange = (e) => {
    const newVal = e.target.value;
    setSettingsInput(newVal);
    setIsDirty(true);
    try {
      const parsed = JSON.parse(newVal);
      if (parsed.colourContext) {
        if (parsed.colourContext.background)
          setBackground(parsed.colourContext.background);
        if (parsed.colourContext.board) setBoard(parsed.colourContext.board);
        else if (parsed.colourContext.background)
          setBoard(parsed.colourContext.background);
        if (parsed.colourContext.strokes)
          setStrokes(parsed.colourContext.strokes);
        if (parsed.colourContext.borders)
          setBorders(parsed.colourContext.borders);
        if (parsed.colourContext.labels) setLabels(parsed.colourContext.labels);
        if (parsed.colourContext.annotations)
          setAnnotations(parsed.colourContext.annotations);
        if (parsed.colourContext.fill) setFill(parsed.colourContext.fill);
      }
      if (parsed.palette && Array.isArray(parsed.palette)) {
        setPalette(parsed.palette);
      }
      applySettingsToRenderUi(parsed, previewRep);
      if (parsed.preferredColour != null && parsed.preferredColour !== "") {
        setPreferredColour(parsed.preferredColour);
      } else {
        setPreferredColour(null);
      }
      if (parsed.customCss && typeof parsed.customCss === "object") {
        setCustomCssText(parsed.customCss.css ?? "");
        setCustomCssActive(parsed.customCss.active !== false);
      } else {
        setCustomCssText("");
        setCustomCssActive(true);
      }
      setSettingsError(null);
      debouncedSetError.cancel();
    } catch (err) {
      debouncedSetError(err.message);
    }
  };

  const addColor = () => {
    setPalette([...palette, selectedColor]);
  };

  const selectDefaultPalette = () => {
    setPalette([...presetColors]);
  };

  const selectColorBlindPalette = () => {
    setPalette([...colorBlindColors]);
  };

  const selectPatternsPalette = () => {
    setPalette([...patternNames]);
  };

  const clearPalette = () => {
    setPalette([]);
  };

  const removeColor = (index) => {
    const newPalette = [...palette];
    newPalette.splice(index, 1);
    setPalette(newPalette);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (draggedIndex !== index && !isNaN(draggedIndex)) {
      const newPalette = [...palette];
      const [draggedItem] = newPalette.splice(draggedIndex, 1);
      newPalette.splice(index, 0, draggedItem);
      setPalette(newPalette);
    }
  };

  const availableGlyphs = useMemo(() => {
    try {
      const json = JSON.parse(rendererJson);
      if (!json || !json.legend) return [];
      const names = new Set();
      const processGlyph = (g) => {
        if (typeof g === "string") {
          names.add(g);
        } else if (typeof g === "object" && g !== null) {
          if (g.name) names.add(g.name);
        }
      };

      Object.values(json.legend).forEach((val) => {
        if (Array.isArray(val)) {
          val.forEach((v) => processGlyph(v));
        } else {
          processGlyph(val);
        }
      });
      return [...names].sort();
    } catch (e) {
      return [];
    }
  }, [rendererJson]);

  const availableSheets = useMemo(() => [...sheets.keys()].sort(), []);
  const availableReplacements = useMemo(() => {
    if (!selectedSheet || !sheets.get(selectedSheet)) return [];
    return [...sheets.get(selectedSheet).glyphs.keys()].sort();
  }, [selectedSheet]);

  const addGlyphMapping = () => {
    if (selectedOriginalGlyph && selectedReplacementGlyph) {
      const newMap = [...glyphMap];
      const idx = newMap.findIndex((p) => p[0] === selectedOriginalGlyph);
      const scale = parseFloat(selectedScale);
      const finalScale = isNaN(scale) ? 1 : scale;
      if (idx >= 0) {
        newMap[idx] = [
          selectedOriginalGlyph,
          selectedReplacementGlyph,
          finalScale,
        ];
      } else {
        newMap.push([
          selectedOriginalGlyph,
          selectedReplacementGlyph,
          finalScale,
        ]);
      }
      setGlyphMap(newMap);
    }
  };

  const removeGlyphMapping = (index) => {
    const newMap = [...glyphMap];
    newMap.splice(index, 1);
    setGlyphMap(newMap);
  };

  const handleResetBoardRender = () => {
    const cleared = clearBoardRenderUi(
      {
        boardStyle,
        strokeWeight,
        labelScale,
        renderOptions,
        glyphMap,
      },
      previewRep,
    );
    setBoardStyle(cleared.boardStyle);
    setStrokeWeight(cleared.strokeWeight);
    setLabelScale(cleared.labelScale);
    setRenderOptions(cleared.renderOptions);
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      if (!renderPreflight.ok) {
        setSettingsError(renderPreflight.errors.join(" "));
        return;
      }
      let settingsToSave;
      try {
        settingsToSave = JSON.parse(settingsInput);
      } catch {
        settingsToSave = JSON.parse(settingsJson);
      }
      if (previewRep && settingsToSave.render) {
        const savePf = preflightRenderCustomization(
          previewRep,
          settingsToSave.render,
        );
        if (!savePf.ok) {
          setSettingsError(savePf.errors.join(" "));
          return;
        }
      }
      if (isGlobalCustomization && settingsToSave.render) {
        const stripped = stripBoardStyleForGlobalRender(settingsToSave.render);
        if (stripped) {
          settingsToSave.render = stripped;
        } else {
          delete settingsToSave.render;
        }
      }
      if (
        settingsToSave.render &&
        !isRenderSettingsWithinSizeLimit(settingsToSave.render)
      ) {
        setSettingsError(t("customize.renderTooLarge"));
        return;
      }
      if (settingsToSave.render) {
        delete settingsToSave.glyphmap;
        delete settingsToSave.boardChrome;
      }
      const res = await callAuthApi("save_customization", {
        metaGame,
        settings: settingsToSave,
      });
      if (res && res.status === 200) {
        setIsDirty(false);
        setImportedLegacyCss(false);
        if (legacyCustomCSS?.[metaGame]) {
          const newobj = { ...legacyCustomCSS };
          delete newobj[metaGame];
          legacyCustomCSSSetter(newobj);
        }
        if (globalMe) {
          const newMe = cloneDeep(globalMe);
          if (!newMe.customizations) {
            newMe.customizations = {};
          }
          newMe.customizations[metaGame] = settingsToSave;
          setGlobalMe(newMe);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await callAuthApi("delete_customization", { metaGame });
      if (res && res.status === 200) {
        if (globalMe) {
          const newMe = cloneDeep(globalMe);
          if (newMe.customizations && metaGame in newMe.customizations) {
            delete newMe.customizations[metaGame];
            setGlobalMe(newMe);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    // If we are on a game-specific page, reset to global defaults if they exist.
    // Otherwise (or if on global page), reset to system defaults.
    if (scope === "game" && globalMe?.customizations?._default) {
      const settings = globalMe.customizations._default;
      const sys_ctx = globalColourContext || {};
      const ctx = settings.colourContext || {};
      setBackground(ctx.background || sys_ctx.background);
      setBoard(
        ctx.board || ctx.background || sys_ctx.board || sys_ctx.background
      );
      setStrokes(ctx.strokes || sys_ctx.strokes);
      setBorders(ctx.borders || sys_ctx.borders);
      setLabels(ctx.labels || sys_ctx.labels);
      setAnnotations(ctx.annotations || sys_ctx.annotations);
      setFill(ctx.fill || sys_ctx.fill);
      setPalette(settings.palette || []);
      applySettingsToRenderUi(settings, previewRep);
      setPreferredColour(settings.preferredColour || null);
      if (settings.customCss) {
        setCustomCssText(settings.customCss.css ?? "");
        setCustomCssActive(settings.customCss.active !== false);
      } else {
        setCustomCssText("");
        setCustomCssActive(true);
      }
    } else if (globalColourContext) {
      // Reset to system defaults
      const sys_ctx = globalColourContext;
      setBackground(sys_ctx.background);
      setBoard(sys_ctx.board || sys_ctx.background);
      setStrokes(sys_ctx.strokes);
      setBorders(sys_ctx.borders);
      setLabels(sys_ctx.labels);
      setAnnotations(sys_ctx.annotations);
      setFill(sys_ctx.fill);
      setPalette([]);
      applySettingsToRenderUi({}, previewRep);
      setPreferredColour(null);
      setCustomCssText("");
      setCustomCssActive(true);
    }
  };

  useEffect(() => {
    const styleId = "customize-preview-css";
    let styleEl = document.getElementById(styleId);
    if (customCssActive && customCssText.trim()) {
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = customCssText;
    } else if (styleEl) {
      styleEl.remove();
    }
    return () => {
      const el = document.getElementById(styleId);
      if (el) {
        el.remove();
      }
    };
  }, [customCssText, customCssActive]);

  useEffect(() => {
    const divId = "renderer-demo-output";
    const svgId = "renderer-demo-svg";
    const div = document.getElementById(divId);
    if (div) {
      div.innerHTML = "";
    }

    try {
      const json = JSON.parse(rendererJson);
      const options = {
        divid: divId,
        svgid: svgId,
        colourContext: {
          background,
          board,
          strokes,
          borders,
          labels,
          annotations,
          fill,
        },
        contextGlobal: false,
        coloursGlobal: metaGame === "_default",
        colours: previewColours ?? undefined,
      };
      const mockMe = {
        customizations: {
          [metaGame]: {
            render: renderCustomization,
          },
        },
      };
      const { displayRep, renderSettings: resolvedRender } = prepareBoardRender(
        json,
        mockMe,
        metaGame,
      );
      applyRenderSettingsToOptions(options, resolvedRender);
      render(displayRep, options);
    } catch (e) {
      if (div) {
        div.innerHTML = `<div class="notification is-danger">${e.message}</div>`;
      }
    }
  }, [
    rendererJson,
    background,
    board,
    strokes,
    borders,
    labels,
    annotations,
    fill,
    previewColours,
    glyphMap,
    renderOptions,
    renderCustomization,
    metaGame,
  ]);

  //   useEffect(() => {console.log(rendererJson)}, [rendererJson]);

  const getContextValue = () => {
    switch (selectedContextProp) {
      case "background":
        return background;
      case "board":
        return board;
      case "strokes":
        return strokes;
      case "borders":
        return borders;
      case "labels":
        return labels;
      case "annotations":
        return annotations;
      case "fill":
        return fill;
      default:
        return "#000000";
    }
  };

  const setContextValue = (val) => {
    switch (selectedContextProp) {
      case "background":
        setBackground(val);
        break;
      case "board":
        setBoard(val);
        break;
      case "strokes":
        setStrokes(val);
        break;
      case "borders":
        setBorders(val);
        break;
      case "labels":
        setLabels(val);
        break;
      case "annotations":
        setAnnotations(val);
        break;
      case "fill":
        setFill(val);
        break;
      default:
        break;
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: "1em" }}>
        <button className="button is-small" onClick={() => navigate(-1)}>
          <span className="icon">
            <i className="fa fa-arrow-left"></i>
          </span>
          <span>{t("Back")}</span>
        </button>
      </div>
      <h1 className="title">{t("customize.title", { gameName })}</h1>
      {providedMetaGame && providedMetaGame !== "_default" && (
        <div className="tabs is-toggle is-centered is-small">
          <ul>
            <li className={scope === "game" ? "is-active" : ""}>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a onClick={() => setScope("game")}>
                <span>
                  {gameinfo.get(providedMetaGame)?.name || providedMetaGame}
                </span>
              </a>
            </li>
            <li className={scope === "global" ? "is-active" : ""}>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a onClick={() => setScope("global")}>
                <span>{t("customize.globalDefaults")}</span>
              </a>
            </li>
          </ul>
        </div>
      )}
      <div className="columns">
        <div className="column is-half">
          <h2 className="subtitle">{t("customize.playerColours")}</h2>
          <div className="field">
            <label className="label is-small">{t("customize.addColour")}</label>
            <div className="help">{t("customize.addColourHelp")}</div>
            <div className="control">
              <HexColorPicker
                color={selectedColor}
                onChange={setSelectedColor}
                style={{ width: "100%", height: "150px" }}
              />
              <HexColorInput
                className="input is-small"
                color={selectedColor}
                onChange={setSelectedColor}
                style={{ marginTop: "0.5em", marginBottom: "0.5em" }}
                prefixed
              />
              <div className="buttons">
                {presetColors.map((c) => (
                  <ColourSwatchButton
                    key={c}
                    color={c}
                    onClick={() => {
                      setSelectedColor(c);
                      setPalette([...palette, c]);
                    }}
                  />
                ))}
                <button
                  className="button is-small"
                  style={{
                    ...swatchButtonStyle,
                    background:
                      "linear-gradient(to top right, transparent calc(50% - 1px), red, transparent calc(50% + 1px))",
                    backgroundColor: "white",
                  }}
                  onClick={() => {
                    setPalette([...palette, null]);
                  }}
                  title={t("customize.defaultSwatch")}
                >
                  &nbsp;
                </button>
                {["#000000", "#ffffff", "#808080"].map((c) => (
                  <ColourSwatchButton
                    key={c}
                    color={c}
                    onClick={() => {
                      setSelectedColor(c);
                      setPalette([...palette, c]);
                    }}
                  />
                ))}
              </div>
              <div className="buttons">
                {colorBlindColors.map((c) => (
                  <ColourSwatchButton
                    key={c}
                    color={c}
                    onClick={() => {
                      setSelectedColor(c);
                      setPalette([...palette, c]);
                    }}
                  />
                ))}
              </div>
              <div className="buttons">
                {patternNames.map((name) => (
                  <PatternSwatchButton
                    key={name}
                    patternName={name}
                    onClick={() => setPalette([...palette, name])}
                  />
                ))}
              </div>
              <div className="buttons">
                <button className="button is-small apButton" onClick={addColor}>
                  {t("customize.addColourBtn")}
                </button>
                <button
                  className="button is-small apButton"
                  onClick={selectDefaultPalette}
                >
                  {t("customize.selectDefaultColours")}
                </button>
                <button
                  className="button is-small apButton"
                  onClick={selectColorBlindPalette}
                >
                  {t("customize.selectColourBlind")}
                </button>
                <button
                  className="button is-small apButton"
                  onClick={selectPatternsPalette}
                >
                  {t("customize.selectPatterns")}
                </button>
                <button
                  className="button is-small apButtonNeutral"
                  onClick={clearPalette}
                >
                  {t("customize.clearColours")}
                </button>
              </div>
            </div>
          </div>
          <div className="tags">
            {palette.map((c, i) => (
              <span
                key={i}
                className="tag is-medium"
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
                style={{
                  color: "#000",
                  border: "1px solid #ccc",
                  cursor: "move",
                  ...(c === null
                    ? {
                        background:
                          "linear-gradient(to top right, transparent calc(50% - 1px), red, transparent calc(50% + 1px))",
                        backgroundColor: "white",
                      }
                    : isPatternName(c)
                    ? {
                        backgroundColor: "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35em",
                      }
                    : { backgroundColor: c }),
                }}
              >
                {isPatternName(c) ? (
                  <>
                    <PatternGlyphPreview patternName={c} size={18} />
                    {c}
                  </>
                ) : (
                  c
                )}
                <button
                  className="delete is-small"
                  onClick={() => removeColor(i)}
                ></button>
              </span>
            ))}
          </div>
          {paletteHints.length > 0 && (
            <div
              className="notification is-info is-light"
              style={{ fontSize: "0.85rem", padding: "1em" }}
            >
              <p>
                <strong>{t("customize.developerHints")}</strong>
              </p>
              <ul
                style={{
                  marginTop: 0,
                  marginLeft: "1.5em",
                  listStyleType: "disc",
                }}
              >
                {paletteHints.map((h, i) => (
                  <li key={i}>
                    <strong>
                      {t("customize.paletteHint", { num: h.num })}
                      {h.player != null &&
                        ` ${t("customize.paletteHintPlayer", {
                          player: h.player,
                        })}`}
                    </strong>
                    : {h.explanation}{" "}
                    {h.default !== undefined && (
                      <span style={{ opacity: 0.8 }}>
                        {t("customize.defaultValue", { value: h.default })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div
            style={{
              marginTop: "1em",
              marginBottom: "1em",
              border: "1px solid var(--tag-background-color)",
              borderRadius: "4px",
              background: "var(--main-bg-color)",
            }}
          >
            <button
              type="button"
              className="button is-small apButtonNeutral is-fullwidth"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "none",
                borderRadius: "4px",
              }}
              aria-expanded={preferredColourOpen}
              onClick={() => setPreferredColourOpen((open) => !open)}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5em",
                  minWidth: 0,
                }}
              >
                <span>{t("customize.preferredColour")}</span>
                {preferredColour && (
                  <>
                    <span
                      aria-hidden="true"
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "2px",
                        backgroundColor: preferredColour,
                        border: "1px solid var(--tag-background-color)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="is-size-7"
                      style={{ color: "var(--secondary-font-color)" }}
                    >
                      {preferredColour}
                    </span>
                  </>
                )}
              </span>
              <span className="icon is-small" aria-hidden="true">
                <i
                  className={`fa fa-chevron-${
                    preferredColourOpen ? "down" : "right"
                  }`}
                />
              </span>
            </button>
            {preferredColourOpen && (
              <div className="field" style={{ padding: "0.75em" }}>
                <div className="help">
                  {scope === "game" &&
                  providedMetaGame &&
                  providedMetaGame !== "_default" ? (
                    <>
                      {t("customize.preferredColourHelpGame")}{" "}
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                      <a onClick={() => setScope("global")}>
                        {t("customize.globalDefaults")}
                      </a>
                      .
                    </>
                  ) : (
                    t("customize.preferredColourHelpGlobal")
                  )}
                </div>
                <div className="control">
                  <HexColorPicker
                    color={preferredColour || "#e31a1c"}
                    onChange={setPreferredColour}
                    style={{ width: "100%", height: "120px" }}
                  />
                  <HexColorInput
                    className="input is-small"
                    color={preferredColour || "#e31a1c"}
                    onChange={setPreferredColour}
                    style={{ marginTop: "0.5em", marginBottom: "0.5em" }}
                    prefixed
                  />
                  <div className="buttons">
                    {presetColors.map((c) => (
                      <ColourSwatchButton
                        key={`preferred-${c}`}
                        color={c}
                        selected={coloursEqual(c, preferredColour)}
                        onClick={() => setPreferredColour(c)}
                      />
                    ))}
                  </div>
                  <div className="buttons">
                    {colorBlindColors.map((c) => (
                      <ColourSwatchButton
                        key={`preferred-cb-${c}`}
                        color={c}
                        selected={coloursEqual(c, preferredColour)}
                        onClick={() => setPreferredColour(c)}
                      />
                    ))}
                  </div>
                  {preferredColour && (
                    <div className="tags" style={{ marginTop: "0.5em" }}>
                      <span
                        className="tag is-medium"
                        style={{
                          color: "#000",
                          border: "1px solid var(--tag-background-color)",
                          backgroundColor: preferredColour,
                        }}
                      >
                        {preferredColour}
                        <button
                          type="button"
                          className="delete is-small"
                          aria-label={t("customize.clearPreferredColour")}
                          onClick={() => setPreferredColour(null)}
                        />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <hr />
          <h2 className="subtitle">{t("customize.boardColours")}</h2>
          <div className="field">
            <label className="label is-small">
              {t("customize.selectProperty")}
            </label>
            <div className="control">
              <div className="select is-small">
                <select
                  value={selectedContextProp}
                  onChange={(e) => setSelectedContextProp(e.target.value)}
                >
                  {contextProps.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="help">
              {contextProps.find((p) => p.value === selectedContextProp)?.help}
            </p>
          </div>
          <div className="field">
            <div className="control">
              <HexColorPicker
                color={getContextValue()}
                onChange={setContextValue}
                style={{ width: "100%", height: "150px" }}
              />
              <HexColorInput
                className="input is-small"
                color={getContextValue()}
                onChange={setContextValue}
                style={{ marginTop: "0.5em", marginBottom: "0.5em" }}
                prefixed
              />
            </div>
          </div>
          {contextHints.length > 0 && (
            <div
              className="notification is-info is-light"
              style={{ fontSize: "0.85rem", padding: "1em" }}
            >
              <p>
                <strong>{t("customize.developerHints")}</strong>
              </p>
              <ul
                style={{
                  marginTop: 0,
                  marginLeft: "1.5em",
                  listStyleType: "disc",
                }}
              >
                {contextHints.map((h, i) => (
                  <li key={i}>
                    <strong>
                      {contextProps.find((p) => p.value === h.name)?.label ||
                        h.name}
                    </strong>
                    : {h.explanation}{" "}
                    {h.default !== undefined && (
                      <span style={{ opacity: 0.8 }}>
                        {t("customize.defaultValue", { value: h.default })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <CustomizeCollapsibleSection
            id="customize-render"
            title={t("customize.renderSection")}
            open={renderSectionOpen}
            onToggle={() => setRenderSectionOpen((open) => !open)}
            tags={
              <>
                {renderCustomization ? (
                  <span
                    className="tag is-light is-size-7"
                    style={{ color: "var(--secondary-font-color)" }}
                  >
                    {t("customize.renderSectionConfigured")}
                  </span>
                ) : null}
                {!renderPreflight.ok && renderPreflight.errors.length > 0 ? (
                  <span className="tag is-danger is-size-7">
                    {t("customize.renderSectionNeedsAttention")}
                  </span>
                ) : null}
              </>
            }
          >
                <p className="help" style={{ marginBottom: "1em" }}>
                  {t("customize.renderSectionHelp")}
                </p>
                {isGlobalCustomization ? (
                  <div
                    className="notification is-warning is-light"
                    style={{ fontSize: "0.85rem", padding: "1em" }}
                  >
                    <p>{t("customize.globalDefaultsSectionNotice")}</p>
                  </div>
                ) : null}
          {boardChromeEligible ? (
            <>
              <div className="field">
                <label className="label is-small">
                  {t("customize.boardStyle")}
                </label>
                <div className="control">
                  <div
                    className={`select is-small${isGlobalCustomization ? " is-disabled" : ""}`}
                  >
                    <select
                      value={boardStyle}
                      disabled={isGlobalCustomization}
                      onChange={(e) => setBoardStyle(e.target.value)}
                    >
                      <option value="">
                        {t("customize.boardStyleGameDefault")}
                      </option>
                      {compatibleBoardStyles.map((style) => (
                        <option key={style} value={style}>
                          {t(`customize.boardStyles.${style}`, {
                            defaultValue: style,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {isGlobalCustomization ? (
                  <p className="help">{t("customize.boardStyleGlobalDisabled")}</p>
                ) : null}
              </div>
              <div className="field">
                <label className="label is-small">
                  {t("customize.strokeWeight")}
                </label>
                <div className="control">
                  <input
                    className="input is-small"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder={t("customize.strokeWeightDefault")}
                    value={strokeWeight}
                    onChange={(e) => setStrokeWeight(e.target.value)}
                    style={{ maxWidth: "8em" }}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label is-small">
                  {t("customize.labelScale")}
                </label>
                <div
                  className="control"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75em",
                    flexWrap: "wrap",
                    maxWidth: "24em",
                  }}
                >
                  <input
                    type="range"
                    min={LABEL_SCALE_SLIDER_MIN}
                    max={LABEL_SCALE_SLIDER_MAX}
                    step={LABEL_SCALE_SLIDER_STEP}
                    value={Math.min(
                      LABEL_SCALE_SLIDER_MAX,
                      Math.max(
                        LABEL_SCALE_SLIDER_MIN,
                        coerceLabelScale(labelScale),
                      ),
                    )}
                    onChange={(e) =>
                      setLabelScale(Number.parseFloat(e.target.value))
                    }
                    style={{ flex: "1 1 12em" }}
                  />
                  <input
                    className="input is-small"
                    type="number"
                    min={LABEL_SCALE_SLIDER_STEP}
                    step={LABEL_SCALE_SLIDER_STEP}
                    value={labelScale}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setLabelScale(1);
                        return;
                      }
                      const n = Number.parseFloat(raw);
                      if (!Number.isNaN(n)) {
                        setLabelScale(n);
                      }
                    }}
                    style={{ width: "5.5em" }}
                    aria-label={t("customize.labelScale")}
                  />
                </div>
                <p className="help">
                  {t("customize.labelScaleHelp", {
                    min: LABEL_SCALE_SLIDER_MIN,
                    max: LABEL_SCALE_SLIDER_MAX,
                  })}
                </p>
              </div>
              <div className="control" style={{ marginBottom: "1em" }}>
                <button
                  type="button"
                  className="button is-small apButtonNeutral"
                  onClick={handleResetBoardRender}
                >
                  {t("customize.resetBoardRender")}
                </button>
              </div>
            </>
          ) : (
            <p className="notification is-light" style={{ fontSize: "0.9rem" }}>
              {t("customize.boardChromeNotEligible")}
            </p>
          )}
          <div className="field">
            <label className="label is-small">
              {t("customize.renderOptionsLabel")}
            </label>
            {RENDER_OPTION_WHITELIST.map((optionKey) => (
              <label key={optionKey} className="checkbox is-small mr-4">
                <input
                  type="checkbox"
                  checked={renderOptions.includes(optionKey)}
                  onChange={() => toggleRenderOption(optionKey)}
                />{" "}
                {t(`customize.renderOptions.${optionKey}`, {
                  defaultValue: optionKey,
                })}
              </label>
            ))}
            <p className="help">{t("customize.renderOptionsHelp")}</p>
          </div>
          {!renderPreflight.ok && renderPreflight.errors.length > 0 ? (
            <div className="notification is-danger is-light">
              <p>
                <strong>{t("customize.renderPreflightErrors")}</strong>
              </p>
              <ul style={{ marginLeft: "1.25em", listStyle: "disc" }}>
                {renderPreflight.errors.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {renderPreflight.warnings?.length > 0 ? (
            <div className="notification is-warning is-light">
              <p>
                <strong>{t("customize.renderPreflightWarnings")}</strong>
              </p>
              <ul style={{ marginLeft: "1.25em", listStyle: "disc" }}>
                {renderPreflight.warnings.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <h3 className="subtitle is-5">{t("customize.glyphReplacements")}</h3>
          <div className="field">
            <label className="label is-small">
              {t("customize.addReplacement")}
            </label>
            <div className="control">
              <div className="select is-small">
                <select
                  value={selectedOriginalGlyph}
                  onChange={(e) => setSelectedOriginalGlyph(e.target.value)}
                >
                  <option value="">{t("customize.selectOriginal")}</option>
                  {availableGlyphs.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <span style={{ margin: "0 0.5em" }}>{t("customize.with")}</span>
              <div className="select is-small">
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                >
                  {availableSheets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="select is-small">
                <select
                  value={selectedReplacementGlyph}
                  onChange={(e) => setSelectedReplacementGlyph(e.target.value)}
                >
                  <option value="">{t("customize.selectReplacement")}</option>
                  {availableReplacements.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <span style={{ margin: "0 0.5em" }}>
                {t("customize.atScale")}
              </span>
              <input
                className="input is-small"
                type="number"
                step="0.1"
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                style={{ width: "5em" }}
              />
              <button
                className="button is-small apButton"
                onClick={addGlyphMapping}
                disabled={!selectedOriginalGlyph || !selectedReplacementGlyph}
              >
                {t("Add")}
              </button>
            </div>
          </div>
          <div className="tags">
            {glyphMap.map((p, i) => (
              <span key={i} className="tag is-medium">
                {p[0]} &rarr; {p[1]}
                {p[2] !== undefined && p[2] !== 1
                  ? ` ${t("customize.scaleSuffix", { scale: p[2] })}`
                  : ""}
                <button
                  className="delete is-small"
                  onClick={() => removeGlyphMapping(i)}
                ></button>
              </span>
            ))}
          </div>
          </CustomizeCollapsibleSection>
        </div>
        <div className="column is-half">
          <label className="label">{t("customize.output")}</label>
          <div
            id="renderer-demo-output"
            className={
              metaGame && metaGame !== "_default"
                ? `board _meta_${metaGame}`
                : undefined
            }
            style={{
              border: "1px solid var(--tag-background-color)",
              minHeight: "200px",
              backgroundColor: background,
              padding: "10px",
            }}
          ></div>
        </div>
      </div>
      <div className="columns">
        <div className="column is-full">
          <CustomizeCollapsibleSection
            id="customize-custom-css"
            title={t("customize.customCss")}
            open={customCssOpen}
            onToggle={() => setCustomCssOpen((open) => !open)}
            tags={
              <>
                {customCssText.trim() ? (
                  <span
                    className="tag is-light is-size-7"
                    style={{ color: "var(--secondary-font-color)" }}
                  >
                    {customCssActive
                      ? t("customize.customCssConfiguredActive")
                      : t("customize.customCssConfiguredInactive")}
                  </span>
                ) : null}
                {importedLegacyCss ? (
                  <span className="tag is-warning is-size-7">
                    {t("customize.customCssImportedTag")}
                  </span>
                ) : null}
              </>
            }
          >
                {isGlobalCustomization ? (
                  <div
                    className="notification is-warning is-light mb-3"
                    style={{ fontSize: "0.85rem", padding: "1em" }}
                  >
                    <p>{t("customize.globalDefaultsSectionNotice")}</p>
                  </div>
                ) : null}
                <div className="content is-size-7">
                  <p>
                    <Trans
                      i18nKey="gameMove.dev.customCssWarning1"
                      components={[<strong key="strong" />]}
                    />
                  </p>
                  <p>{t("customize.customCssHelp")}</p>
                </div>
                {importedLegacyCss ? (
                  <p className="help mb-2">{t("customize.importedLegacyCss")}</p>
                ) : null}
                <div className="field">
                  <div className="control">
                    <textarea
                      className="textarea is-small"
                      rows="8"
                      value={customCssText}
                      placeholder={t("gameMove.dev.pasteCssPlaceholder")}
                      onChange={(e) => setCustomCssText(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={customCssActive}
                      onChange={(e) => setCustomCssActive(e.target.checked)}
                    />{" "}
                    {t("gameMove.dev.activateCustomCss")}
                  </label>
                </div>
          </CustomizeCollapsibleSection>
        </div>
      </div>
      <div className="columns">
        <div className="column is-full">
          <h2 className="subtitle">{t("customize.settingsJson")}</h2>
          <div className="field">
            <div className="control">
              <textarea
                className="textarea"
                rows="15"
                value={settingsInput}
                onChange={handleSettingsChange}
              />
            </div>
            {settingsError ? (
              <p className="help is-danger">{settingsError}</p>
            ) : (
              <p className="help">{t("customize.pasteSettingsHelp")}</p>
            )}
          </div>
          <div className="control">
            <button
              className="button is-small apButton"
              onClick={handleSave}
              disabled={!isDirty || !renderPreflight.ok}
            >
              {t("customize.saveSettings")}
            </button>
          </div>
          <div className="control">
            <button
              className="button is-small apButtonNeutral"
              onClick={handleReset}
            >
              {t("customize.resetToDefaults")}
            </button>
          </div>
          {providedMetaGame && providedMetaGame !== "_default" ? (
            <div className="control">
              <button
                className="button is-small apButtonNeutral"
                onClick={() => setShowApplyModal(true)}
                disabled={isDirty}
                title={
                  isDirty ? t("customize.applySaveFirst") : undefined
                }
              >
                {t("customize.applyToOtherGames")}
              </button>
            </div>
          ) : null}
          <div className="control">
            <button
              className="button is-small apButtonAlert"
              onClick={handleDelete}
              disabled={!globalMe?.customizations?.[metaGame]}
            >
              {t("customize.deleteCustomization")}
            </button>
          </div>
        </div>
      </div>
      <ApplyCustomizationModal
        show={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        sourceMetaGame={providedMetaGame}
        sourceSettings={
          showApplyModal && !isDirty
            ? JSON.parse(settingsJson)
            : null
        }
      />
    </div>
  );
}

export default Customize;
