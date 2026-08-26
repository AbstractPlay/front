import rendererPkg from "@abstractplay/renderer";

const renderStatic =
  rendererPkg.renderStatic || rendererPkg.default?.renderStatic;

function normalizeRenderReps(renderrep) {
  if (renderrep == null) return [];
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
export function renderBoardSvg(
  renderrep,
  baseOptions,
  { layerIndex, metaGame } = {}
) {
  const reps = normalizeRenderReps(renderrep);
  if (reps.length === 0) return null;

  let index = layerIndex;
  if (
    index == null ||
    Number.isNaN(index) ||
    index < 0 ||
    index >= reps.length
  ) {
    index = reps.length - 1;
  }

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

    if (typeof renderStatic === "function") {
      const svgString = renderStatic(reps[index], options);
      const svg = svgFromStaticString(svgString);
      return svg ?? container.querySelector("svg")?.cloneNode(true) ?? null;
    }

    const render = rendererPkg.render || rendererPkg.default?.render;
    render(reps[index], options);
    const svg = container.querySelector("svg");
    if (!svg) return null;
    return svg.cloneNode(true);
  } finally {
    document.body.removeChild(container);
  }
}
