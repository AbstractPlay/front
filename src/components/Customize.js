import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { render } from "@abstractplay/renderer";
import { gameinfo } from "@abstractplay/gameslib";
import { callAuthApi } from "../lib/api";
import { useStore } from "../stores";
import { isEqual, cloneDeep } from "lodash";
import { sheets } from "@abstractplay/renderer";

function Customize(props) {
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
  const [rendererJson, setRendererJson] = useState(
    inJSON ?? defaultRendererJson
  );

  useEffect(() => {
    if (inJSON === undefined || inJSON === null) {
      if (metaGame === "_default") {
        setRendererJson(defaultRendererJson);
      } else {
        fetch(`https://thumbnails.abstractplay.com/${metaGame}.json`)
          .then((res) => (res.ok ? res.json() : Promise.reject(res)))
          .then((data) => setRendererJson(data))
          .catch(() => {
            setRendererJson(defaultRendererJson);
          });
      }
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

  // Glyph mapping state
  const [glyphMap, setGlyphMap] = useState([]);
  const [selectedOriginalGlyph, setSelectedOriginalGlyph] = useState("");
  const [selectedSheet, setSelectedSheet] = useState("core");
  const [selectedReplacementGlyph, setSelectedReplacementGlyph] = useState("");

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

  const contextProps = [
    {
      label: "Background",
      value: "background",
      help: "The colour of the area surrounding the board.",
    },
    {
      label: "Board",
      value: "board",
      help: "The colour of the board itself. Defaults to background colour if not set.",
    },
    {
      label: "Strokes",
      value: "strokes",
      help: "The colour of lines drawn on the board.",
    },
    {
      label: "Borders",
      value: "borders",
      help: "The colour of fixed piece borders.",
    },
    {
      label: "Labels",
      value: "labels",
      help: "The colour of coordinate labels.",
    },
    {
      label: "Annotations",
      value: "annotations",
      help: "The colour of move annotations.",
    },
    {
      label: "Fill",
      value: "fill",
      help: 'The colour used to fill certain board elements. Basically, the "opposite" of the background.',
    },
  ];
  const [selectedContextProp, setSelectedContextProp] = useState("background");

  const settingsJson = useMemo(() => {
    return JSON.stringify(
      {
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
      },
      null,
      2
    );
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
  ]);

  const [settingsInput, setSettingsInput] = useState(settingsJson);
  const [isDirty, setIsDirty] = useState(false);
  const firstUpdate = useRef(true);

  useEffect(() => {
    if (
      globalMe !== null &&
      globalMe !== undefined &&
      globalMe.customizations !== undefined &&
      globalMe.customizations !== null &&
      metaGame in globalMe.customizations
    ) {
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
      if (settings.palette && Array.isArray(settings.palette)) {
        setPalette(settings.palette);
      }
      if (settings.glyphmap && Array.isArray(settings.glyphmap)) {
        setGlyphMap(settings.glyphmap);
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
      setGlyphMap([]);
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
        setGameName("Global Defaults");
      } else {
        setGameName(gameinfo.get(metaGame)?.name || metaGame);
      }
    } else {
      setGameName("");
    }
  }, [metaGame]);

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
    } catch (err) {
      // ignore
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

  const clearPalette = () => {
    setPalette([]);
  };

  const removeColor = (index) => {
    const newPalette = [...palette];
    newPalette.splice(index, 1);
    setPalette(newPalette);
  };

  const availableGlyphs = useMemo(() => {
    try {
      const json = JSON.parse(rendererJson);
      if (!json.legend) return [];
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
      if (idx >= 0) {
        newMap[idx] = [selectedOriginalGlyph, selectedReplacementGlyph];
      } else {
        newMap.push([selectedOriginalGlyph, selectedReplacementGlyph]);
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
    if (globalColourContext) {
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
          <span>Back</span>
        </button>
      </div>
      <h1 className="title">Customize Settings for {gameName}</h1>
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
                <span>Global Defaults</span>
              </a>
            </li>
          </ul>
        </div>
      )}
      <div className="columns">
        <div className="column is-half">
          <h2 className="subtitle">Board Colours</h2>
          <div className="field">
            <label className="label is-small">Select Property</label>
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
          <hr />
          <h2 className="subtitle">Player Colours</h2>
          <div className="field">
            <label className="label is-small">Add Colour</label>
            <div className="help">
              Select a colour and click the "Add Colour" button. The default
              colours can be selected by clicking on the swatch. If the palette
              is empty, the default palette will be used.
            </div>
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
                  <button
                    key={c}
                    className="button is-small"
                    style={{ backgroundColor: c, width: "20px", padding: 0 }}
                    onClick={() => {
                      setSelectedColor(c);
                      setPalette([...palette, c]);
                    }}
                  >
                    &nbsp;
                  </button>
                ))}
              </div>
              <div className="buttons">
                <button className="button is-small apButton" onClick={addColor}>
                  Add Colour
                </button>
                <button
                  className="button is-small apButton"
                  onClick={selectDefaultPalette}
                >
                  Select default colours
                </button>
                <button
                  className="button is-small apButton"
                  onClick={selectColorBlindPalette}
                >
                  Select colour blind colours
                </button>
                <button
                  className="button is-small apButtonNeutral"
                  onClick={clearPalette}
                >
                  Clear colours
                </button>
              </div>
            </div>
          </div>
          <div className="tags">
            {palette.map((c, i) => (
              <span
                key={i}
                className="tag is-medium"
                style={{
                  backgroundColor: c,
                  color: "#000",
                  border: "1px solid #ccc",
                }}
              >
                {c}
                <button
                  className="delete is-small"
                  onClick={() => removeColor(i)}
                ></button>
              </span>
            ))}
          </div>
          <hr />
          <h2 className="subtitle">Glyph Replacements</h2>
          <div className="field">
            <label className="label is-small">Add Replacement</label>
            <div className="control">
              <div className="select is-small">
                <select
                  value={selectedOriginalGlyph}
                  onChange={(e) => setSelectedOriginalGlyph(e.target.value)}
                >
                  <option value="">-- Select Original --</option>
                  {availableGlyphs.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <span style={{ margin: "0 0.5em" }}>with</span>
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
                  <option value="">-- Select Replacement --</option>
                  {availableReplacements.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="button is-small apButton"
                onClick={addGlyphMapping}
                disabled={!selectedOriginalGlyph || !selectedReplacementGlyph}
              >
                Add
              </button>
            </div>
          </div>
          <div className="tags">
            {glyphMap.map((p, i) => (
              <span key={i} className="tag is-medium">
                {p[0]} &rarr; {p[1]}
                <button
                  className="delete is-small"
                  onClick={() => removeGlyphMapping(i)}
                ></button>
              </span>
            ))}
          </div>
        </div>
        <div className="column is-half">
          <label className="label">Output</label>
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
          <h2 className="subtitle">Settings JSON</h2>
          <div className="field">
            <div className="control">
              <textarea
                className="textarea"
                rows="15"
                value={settingsInput}
                onChange={handleSettingsChange}
              />
            </div>
            <p className="help">Paste settings JSON here to apply.</p>
          </div>
          <div className="control">
            <button
              className="button is-small apButton"
              onClick={handleSave}
              disabled={!isDirty}
            >
              Save Settings
            </button>
          </div>
          <div className="control">
            <button
              className="button is-small apButtonNeutral"
              onClick={handleReset}
            >
              Reset to Defaults
            </button>
          </div>
          <div className="control">
            <button
              className="button is-small apButtonAlert"
              onClick={handleDelete}
              disabled={!globalMe?.customizations?.[metaGame]}
            >
              Delete Customization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customize;
