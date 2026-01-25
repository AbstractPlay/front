// import React, { useState, useEffect, useContext, useRef } from "react";
import { useStorageState } from "react-use-storage-state";
// import { MeContext, ColourContext } from "../pages/Skeleton";
// import { customAlphabet } from "nanoid";
// import { render, addPrefix } from "@abstractplay/renderer";
// const nanoid = customAlphabet(
//   "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
//   5
// );

function Thumbnail({ meta }) {
  //   const [json, setJson] = useState(null);
  //   const [svg, setSvg] = useState(null);
  //   const [prefix] = useState(nanoid());
  //   const [globalMe] = useContext(MeContext);
  //   const [colourContext] = useContext(ColourContext);
  const [colorMode] = useStorageState("color-mode", "light");
  //   const shadowEle = useRef(null);
  //   const broken = React.useMemo(() => [], []);

  // fetch json
  //   useEffect(() => {
  //     async function fetchData() {
  //       try {
  //         var url = new URL(`https://thumbnails.abstractplay.com/${meta}.json`);
  //         const res = await fetch(url);
  //         const result = await res.json();
  //         setJson(result);
  //       } catch (error) {
  //         console.log(error);
  //         setJson(null);
  //       }
  //     }
  //     fetchData();
  //   }, [meta]);

  // fetch svg
  //   useEffect(() => {
  //     async function fetchData() {
  //       try {
  //         var url = new URL(`https://thumbnails.abstractplay.com/${meta}-${colorMode}.svg`);
  //         const res = await fetch(url);
  //         const svgText = await res.text();
  //         // const idx = svgText.indexOf(">");
  //         // console.log("svg tag", svgText.substring(0, idx + 1));
  //         const encoded = encodeURIComponent(svgText)
  //             .replace(/'/g, "%27")
  //             .replace(/"/g, "%22");
  //         setSvg(encoded);
  //       } catch (error) {
  //         console.log(error);
  //         setSvg(null);
  //       }
  //     }
  //     fetchData();
  //   }, [meta, colorMode]);

  //   useEffect(() => {
  //     // remove previous image
  //     if (shadowEle.current !== null) {
  //       const svg = shadowEle.current.querySelector("svg");
  //       if (svg !== null) {
  //         svg.remove();
  //       }
  //     }
  //     // if broken, render live
  //     if (broken.includes(meta)) {
  //         // setup rendering options
  //         const options = { divid: `shadow${prefix}` };
  //         if (json !== null) {
  //             options.showAnnotations = true;
  //             options.svgid = prefix;
  //             options.prefix = prefix;
  //             options.colourContext = colourContext;
  //             console.log("rendering", meta, json, options);

  //             // render it
  //             try {
  //                 if (shadowEle !== null) {
  //                 render(json, options);
  //                 const svgEle = shadowEle.current.querySelector("svg");
  //                 if (svgEle !== undefined) {
  //                     const svgText = addPrefix(svgEle.outerHTML, options);
  //                     if (svgText !== null && svgText !== undefined && svgText !== "") {
  //                         // const idx = svgText.indexOf(">");
  //                         // console.log("svg tag", svgText.substring(0, idx + 1));
  //                         const encoded = encodeURIComponent(svgText)
  //                             .replace(/'/g, "%27")
  //                             .replace(/"/g, "%22");
  //                         setSvg(encoded);
  //                     } else {
  //                         console.log(`DID NOT GET SVG TEXT BACK FOR ${meta}`);
  //                         setSvg(null);
  //                     }
  //                 }
  //                 }
  //             } catch (e) {
  //                 console.error(`An error occurred while generating SVG for ${meta}:`, e);
  //                 setSvg(null);
  //             }
  //         }
  //     }
  //     // otherwise, do nothing
  //   }, [meta, json, colourContext, globalMe, prefix, broken]);

  return (
    <img
      src={`https://thumbnails.abstractplay.com/${meta}-${colorMode}.svg`}
      alt={`Thumbnail for ${meta}`}
      width="100%"
      height="auto"
    />
  );
  //   return (
  //     <>
  //       {svg === null ? null : (
  //         <div>
  //           <img
  //             src={`data:image/svg+xml;utf8,${svg}`}
  //             alt={`Thumbnail for ${meta}`}
  //             width="100%"
  //             height="auto"
  //           />
  //         </div>
  //       )}
  //       {svg !== null ? null : <div id={`shadow${prefix}`} ref={shadowEle} />}
  //     </>
  //   );
}

export default Thumbnail;
