import React, { useState, useEffect, useContext } from "react";
import { MeContext, ColourContext } from "../pages/Skeleton";
import { customAlphabet } from 'nanoid'
import { renderStatic } from "@abstractplay/renderer";
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 5);

function Thumbnail({
    meta,
}) {
  const [json, setJson] = useState(null);
  const [svg, setSvg] = useState(null);
  const [globalMe,] = useContext(MeContext);
  const [colourContext,] = useContext(ColourContext);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(`https://thumbnails.abstractplay.com/${meta}.json`);
        const res = await fetch(url);
        const result = await res.json();
        setJson(result);
      } catch (error) {
        console.log(error);
        setJson(null);
      }
    }
    fetchData();
  }, [meta]);

function getSetting(setting, deflt, gameSettings, userSettings, metaGame) {
  if (gameSettings !== undefined && gameSettings[setting] !== undefined) {
    return gameSettings[setting];
  } else if (userSettings !== undefined) {
    if (
      userSettings[metaGame] !== undefined &&
      userSettings[metaGame][setting] !== undefined
    ) {
      return userSettings[metaGame][setting];
    } else if (
      userSettings.all !== undefined &&
      userSettings.all[setting] !== undefined
    ) {
      return userSettings.all[setting];
    } else {
      return deflt;
    }
  } else {
    return deflt;
  }
}

  useEffect(() => {
    // process settings
    const settings = {};
    settings.display = getSetting(
      "display",
      undefined,
      {},
      globalMe?.settings,
      meta
    );
    settings.color = getSetting(
      "color",
      "standard",
      {},
      globalMe?.settings,
      meta
    );
    // setup rendering options
    const options = { divid: "thumbnailSvg"};
    if (json !== null && settings !== null) {
        if (settings.color === "blind") {
            options.colourBlind = true;
            // } else if (settings.color === "patterns") {
            //   options.patterns = true;
        }
        if (settings.color !== "standard" && settings.color !== "blind") {
            const palette = globalMe.palettes?.find(
            (p) => p.name === settings.color
            );
            if (palette !== undefined) {
                options.colours = [...palette.colours];
                while (options.colours.length < 12) {
                    options.colours.push("#fff");
                }
            }
        }
        const nano = nanoid();
        options.showAnnotations = true;
        options.svgid = nano;
        options.prefix = nano;
        options.colourContext = colourContext;
        console.log("rendering", json, options);

        // render it
        let svgText = null;
        try {
            svgText = renderStatic(json, options);
            if (svgText !== null && svgText !== undefined && svgText !== "") {
                const encoded = encodeURIComponent(svgText)
                    .replace(/'/g, "%27")
                    .replace(/"/g, "%22");
                setSvg(encoded);
            } else {
                setSvg(null);
            }
        } catch {
            setSvg(null);
        }
    }
  }, [meta, json, colourContext, globalMe]);

  return (
    <>
      {svg === null ? null : (
        <div
            id="thumbnailSvg"
        >
            <img
            src={`data:image/svg+xml;utf8,${svg}`}
            alt={`Thumbnail for ${meta}`}
            width="100%"
            height="auto"
            />
        </div>
      )}
    </>
  );
}

export default Thumbnail;
