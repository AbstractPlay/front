import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { render } from "@abstractplay/renderer";
import { gameinfo } from "@abstractplay/gameslib";
import { callAuthApi } from "../lib/api";
import { useStore } from "../stores";
import { isEqual, cloneDeep } from "lodash";

function Customize(props) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const providedMetaGame = props.metaGame || params.metaGame;
  const [scope, setScope] = useState("game");
  const metaGame =
    scope === "global" || !providedMetaGame ? "_default" : providedMetaGame;
  const inJSON = props.inJSON || location.state?.inJSON;
  const [rendererJson, setRendererJson] = useState(
    inJSON ??
      JSON.stringify(
        {
          board: { style: "squares-checkered", width: 4, height: 4 },
          legend: {
            A: { name: "piece", colour: 1 },
            B: { name: "piece", colour: 2 },
          },
          pieces: "AAB-\nA-BB\n----\n----",
        },
        null,
        2
      )
  );
  const [gameName, setGameName] = useState("");
  const globalMe = useStore((state) => state.globalMe);
  const setGlobalMe = useStore((state) => state.setGlobalMe);
  const globalColourContext = useStore((state) => state.colourContext);

  // Context state
  const [background, setBackground] = useState("#ffffff");
  const [strokes, setStrokes] = useState("#000000");
  const [borders, setBorders] = useState("#000000");
  const [labels, setLabels] = useState("#000000");
  const [annotations, setAnnotations] = useState("#000000");
  const [fill, setFill] = useState("#000000");

  // Palette state
  const [palette, setPalette] = useState([]);
  const [selectedColor, setSelectedColor] = useState("#ffffff");

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

  const settingsJson = useMemo(() => {
    return JSON.stringify(
      {
        colourContext: {
          background,
          strokes,
          borders,
          labels,
          annotations,
          fill,
        },
        palette,
      },
      null,
      2
    );
  }, [background, strokes, borders, labels, annotations, fill, palette]);

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
    } else if (globalColourContext) {
      if (globalColourContext.background)
        setBackground(globalColourContext.background);
      if (globalColourContext.strokes) setStrokes(globalColourContext.strokes);
      if (globalColourContext.borders) setBorders(globalColourContext.borders);
      if (globalColourContext.labels) setLabels(globalColourContext.labels);
      if (globalColourContext.annotations)
        setAnnotations(globalColourContext.annotations);
      if (globalColourContext.fill) setFill(globalColourContext.fill);
      setPalette([]);
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
      if (globalColourContext.strokes) setStrokes(globalColourContext.strokes);
      if (globalColourContext.borders) setBorders(globalColourContext.borders);
      if (globalColourContext.labels) setLabels(globalColourContext.labels);
      if (globalColourContext.annotations)
        setAnnotations(globalColourContext.annotations);
      if (globalColourContext.fill) setFill(globalColourContext.fill);
      setPalette([]);
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
          strokes,
          borders,
          labels,
          annotations,
          fill,
        },
        colours: palette.length > 0 ? palette : undefined,
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
    strokes,
    borders,
    labels,
    annotations,
    fill,
    palette,
  ]);

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
          <div className="field">
            <label className="label">Renderer JSON</label>
            <div className="control">
              <textarea
                className="textarea"
                rows="10"
                value={rendererJson}
                onChange={(e) => setRendererJson(e.target.value)}
              />
            </div>
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
        <div className="column is-one-third">
          <h2 className="subtitle">Board Colours</h2>
          <div className="columns is-multiline">
            {[
              { label: "Background", val: background, set: setBackground },
              { label: "Strokes", val: strokes, set: setStrokes },
              { label: "Borders", val: borders, set: setBorders },
              { label: "Labels", val: labels, set: setLabels },
              { label: "Annotations", val: annotations, set: setAnnotations },
              { label: "Fill", val: fill, set: setFill },
            ].map((item) => (
              <div className="column is-half" key={item.label}>
                <div className="field">
                  <label className="label is-small">{item.label}</label>
                  <div className="control">
                    <HexColorPicker
                      color={item.val}
                      onChange={item.set}
                      style={{ width: "100%", height: "100px" }}
                    />
                    <HexColorInput
                      className="input is-small"
                      color={item.val}
                      onChange={item.set}
                      prefixed
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="column is-one-third">
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
                    onClick={() => setSelectedColor(c)}
                  >
                    &nbsp;
                  </button>
                ))}
              </div>
              <div className="buttons">
                <button
                  className="button is-small apButton"
                  onClick={addColor}
                >
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
        </div>
        <div className="column is-one-third">
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
