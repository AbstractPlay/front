import { render, renderComposite } from "@abstractplay/renderer";
import {
  isCompositeRenderRep,
  applySeatRotateToComposite,
  prepareDisplayRenderRep,
} from "./renderOutput.js";
import {
  prepareBoardRender,
  applyRenderSettingsToOptions,
} from "./prepareBoardRender.js";
import { apPerfRun } from "./apPerf.js";
import { resolveEffectiveRenderSettings } from "./resolveEffectiveRenderSettings.js";
import { clickBoardContextFromDisplayRep, buildHandleClickUi } from "./clickBoardContext.js";

function attachOffscreenContainer() {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);
  return container;
}

/**
 * Render board SVG layer(s) off-screen (caller owns returned DOM nodes).
 *
 * @returns {{ layers: (Element | null)[], boardRenderIndex: number }}
 */
export function renderLiveBoardLayers({
  renderrep,
  metaGame,
  globalMe,
  seatRotate = 0,
  baseOptions,
  applyColourOpts,
  applyGlyphMap,
  canBoardClick,
  onBoardClick,
  stackExpanding,
  onStackColumnHover,
  clickBoardContextRef,
}) {
  return apPerfRun("explore.boardSvgLayers", () => {
  const layers = [];

  if (isCompositeRenderRep(renderrep)) {
    let displayRep = prepareDisplayRenderRep(renderrep, globalMe, metaGame);
    displayRep = applySeatRotateToComposite(displayRep, seatRotate);
    /** @type {Map<string, import('@abstractplay/gameslib').IClickBoardContext>} */
    const panelContextById = new Map();
    for (const panel of displayRep.panels ?? []) {
      const board = clickBoardContextFromDisplayRep(panel.render);
      if (board && panel.id != null) {
        panelContextById.set(String(panel.id), board);
      }
    }
    if (clickBoardContextRef) {
      clickBoardContextRef.current = panelContextById;
    }
    const container = attachOffscreenContainer();
    const layerOptions = { ...baseOptions };
    delete layerOptions.rotate;
    applyColourOpts(layerOptions);
    const primaryPanel = renderrep.panels[0]?.render;
    if (primaryPanel) {
      applyGlyphMap(layerOptions, primaryPanel);
    }
    const primarySettings = resolveEffectiveRenderSettings(
      globalMe,
      metaGame,
      primaryPanel ?? {},
    );
    applyRenderSettingsToOptions(layerOptions, primarySettings);
    if (canBoardClick) {
      layerOptions.boardClick = (panelId, row, col, piece) => {
        const board = panelContextById.get(String(panelId));
        onBoardClick(row, col, piece, buildHandleClickUi(panelId, board));
      };
    }
    if (stackExpanding && onStackColumnHover) {
      layerOptions.boardHover = (panelId, row, col) => {
        onStackColumnHover(col, row, panelId);
      };
    }
    renderComposite(displayRep, { ...layerOptions, divelem: container });
    layers.push(container.firstChild);
    document.body.removeChild(container);
    return { layers, boardRenderIndex: 0 };
  }

  const frames = Array.isArray(renderrep) ? [...renderrep] : [renderrep];
  for (let i = 0; i < frames.length; i++) {
    const rawRep = frames[i];
    const { displayRep, renderSettings } = prepareBoardRender(
      rawRep,
      globalMe,
      metaGame,
    );
    const layerOptions = { ...baseOptions, rotate: seatRotate };
    applyColourOpts(layerOptions);
    applyGlyphMap(layerOptions, rawRep);
    applyRenderSettingsToOptions(layerOptions, renderSettings);
    const isTopFrame = i === frames.length - 1;
    if (stackExpanding && isTopFrame && onStackColumnHover) {
      layerOptions.boardHover = (row, col) => {
        onStackColumnHover(col, row);
      };
    }
    if (canBoardClick && isTopFrame) {
      const board = clickBoardContextFromDisplayRep(displayRep);
      const ui = buildHandleClickUi(undefined, board);
      if (clickBoardContextRef) {
        clickBoardContextRef.current = ui;
      }
      layerOptions.boardClick = (row, col, piece) => {
        onBoardClick(row, col, piece, ui);
      };
    }
    const container = attachOffscreenContainer();
    render(displayRep, { ...layerOptions, divelem: container });
    layers.push(container.firstChild);
    document.body.removeChild(container);
  }
  return { layers, boardRenderIndex: Math.max(0, layers.length - 1) };
  });
}
