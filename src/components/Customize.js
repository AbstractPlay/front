import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { render, renderglyph, sheets } from "@abstractplay/renderer";
import { gameinfo } from "@abstractplay/gameslib";
import { callAuthApi } from "../lib/api";
import { coloursEqual } from "../lib/resolveEffectivePalette.js";
import { useStore } from "../stores";
import { isEqual, cloneDeep, debounce } from "lodash";
import { useTranslation } from "react-i18next";
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
  const [selectedOriginalGlyph, setSelectedOriginalGlyph] = useState("");
  const [selectedSheet, setSelectedSheet] = useState("core");
  const [selectedReplacementGlyph, setSelectedReplacementGlyph] = useState("");
  const [selectedScale, setSelectedScale] = useState("1");

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
      glyphmap: glyphMap,
    };
    if (preferredColour) {
      settings.preferredColour = preferredColour;
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
    glyphMap,
    preferredColour,
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
      setGlyphMap(settings.glyphmap || []);
      setPreferredColour(settings.preferredColour || null);
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
      setGlyphMap(settings.glyphmap || []);
      setPreferredColour(settings.preferredColour || null);
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
      setGlyphMap([]);
      setPreferredColour(null);
    }
  }, [globalMe, metaGame, globalColourContext]);

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
      if (parsed.glyphmap && Array.isArray(parsed.glyphmap)) {
        setGlyphMap(parsed.glyphmap);
      }
      if (parsed.preferredColour != null && parsed.preferredColour !== "") {
        setPreferredColour(parsed.preferredColour);
      } else {
        setPreferredColour(null);
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

  const handleSave = async () => {
    try {
      const res = await callAuthApi("save_customization", {
        metaGame,
        settings: JSON.parse(settingsJson),
      });
      if (res && res.status === 200) {
        setIsDirty(false);
        if (globalMe) {
          const newMe = cloneDeep(globalMe);
          if (!newMe.customizations) {
            newMe.customizations = {};
          }
          newMe.customizations[metaGame] = JSON.parse(settingsJson);
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
      setGlyphMap(settings.glyphmap || []);
      setPreferredColour(settings.preferredColour || null);
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
      setGlyphMap([]);
      setPreferredColour(null);
    }
  };

  useEffect(() => {
    const divId = "renderer-demo-output";
    const svgId = "renderer-demo-svg";
    const div = document.getElementById(divId);
    if (div) {
      div.innerHTML = "";
    }

    try {
      const json = JSON.parse(rendererJson);
      console.log("Preview JSON:", json);
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
        coloursGlobal: false,
        colours: palette.length > 0 ? palette : undefined,
        glyphmap: glyphMap.length > 0 ? glyphMap : undefined,
      };
      render(json, options);
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
    palette,
    glyphMap,
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
          <hr />
          <h2 className="subtitle">{t("customize.glyphReplacements")}</h2>
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
        </div>
        <div className="column is-half">
          <label className="label">{t("customize.output")}</label>
          <div
            id="renderer-demo-output"
            style={{
              border: "1px solid #ccc",
              minHeight: "200px",
              backgroundColor: background,
              padding: "10px",
            }}
          ></div>
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
              disabled={!isDirty}
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
    </div>
  );
}

export default Customize;
