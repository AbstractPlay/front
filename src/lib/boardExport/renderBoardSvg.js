import rendererPkg from "@abstractplay/renderer";
import { isCompositeRenderRep } from "../renderOutput.js";

const render =
  rendererPkg.render || rendererPkg.default?.render;
const renderComposite =
  rendererPkg.renderComposite || rendererPkg.default?.renderComposite;
const renderStatic =
  rendererPkg.renderStatic || rendererPkg.default?.renderStatic;

function normalizeRenderReps(renderrep) {
  if (renderrep == null) return [];
  if (isCompositeRenderRep(renderrep)) {
    return [renderrep];
  }
  return Array.isArray(renderrep) ? [...renderrep] : [renderrep];
}

function svgFromStaticString(svgString) {
  if (!svgString) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const root = doc.documentElement;
  if (root?.nodeName.toLowerCase() === "parsererror") {
    return null;
  }
  return document.importNode(root, true);
}

/**
 * Render a renderrep offscreen and return the root SVG element.
 */
export function renderBoardSvg(renderrep, baseOptions, { metaGame } = {}) {
  const reps = normalizeRenderReps(renderrep);
  if (reps.length === 0) return null;

  const index = reps.length - 1;

  const container = document.createElement("div");
  container.className = metaGame ? `board _meta_${metaGame}` : "board";
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.visibility = "hidden";
  container.style.width = "1000px";
  container.style.height = "1000px";
  document.body.appendChild(container);

  try {
    const options = {
      ...baseOptions,
      divelem: container,
      divid: "board-export",
    };

    const rep = reps[index];
    if (isCompositeRenderRep(rep)) {
      if (typeof renderComposite === "function") {
        delete options.rotate;
        renderComposite(rep, options);
      }
    } else if (typeof renderStatic === "function") {
      const svgString = renderStatic(rep, options);
      const svg = svgFromStaticString(svgString);
      return svg ?? container.querySelector("svg")?.cloneNode(true) ?? null;
    } else if (typeof render === "function") {
      render(rep, options);
    }
    const svg = container.querySelector("svg");
    if (!svg) return null;
    return svg.cloneNode(true);
  } finally {
    document.body.removeChild(container);
  }
}
