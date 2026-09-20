import { describe, expect, it } from "vitest";
import {
  buildRenderCustomization,
  coerceLabelScale,
  filterWhitelistedRenderOptions,
  isRenderSettingsWithinSizeLimit,
  LABEL_SCALE_SLIDER_MAX,
  LABEL_SCALE_SLIDER_MIN,
  MAX_RENDER_SETTINGS_BYTES,
  preflightRenderCustomization,
  renderSettingsByteSize,
  renderUiStateFromSettings,
  stripBoardStyleForGlobalRender,
} from "./customizeRenderSettings.js";

describe("customizeRenderSettings", () => {
  it("exports slider range constants without capping saved labelScale", () => {
    expect(LABEL_SCALE_SLIDER_MIN).to.equal(0.75);
    expect(LABEL_SCALE_SLIDER_MAX).to.equal(3);
    const render = buildRenderCustomization({
      boardStyle: "",
      strokeWeight: "",
      labelScale: 4,
      renderOptions: [],
      glyphMap: [],
    });
    expect(render?.board?.labelScale).to.equal(4);
    expect(coerceLabelScale(4)).to.equal(4);
  });

  it("builds render from UI state and omits empty sections", () => {
    expect(
      buildRenderCustomization({
        boardStyle: "",
        strokeWeight: "",
        labelScale: 1,
        renderOptions: [],
        glyphMap: [],
      }),
    ).to.equal(null);

    expect(
      buildRenderCustomization({
        boardStyle: "vertex",
        strokeWeight: "",
        labelScale: 1,
        renderOptions: ["hide-star-points", "hide-labels"],
        glyphMap: [["piece", "meeple", 1.2]],
      }),
    ).to.deep.equal({
      board: { style: "vertex" },
      options: ["hide-labels", "hide-star-points"],
      glyphmap: [["piece", "meeple", 1.2]],
    });
  });

  it("filters unknown options and preserves whitelist order", () => {
    expect(
      filterWhitelistedRenderOptions([
        "hide-star-points",
        "bogus",
        "no-border",
      ]),
    ).to.deep.equal(["no-border", "hide-star-points"]);
  });

  it("hydrates labelScale from JSON without clamping to slider range", () => {
    const ui = renderUiStateFromSettings({
      render: { board: { labelScale: 2.5 } },
    });
    expect(ui.labelScale).to.equal(2.5);
    const uiHigh = renderUiStateFromSettings({
      render: { board: { labelScale: 5 } },
    });
    expect(uiHigh.labelScale).to.equal(5);
  });

  it("hydrates options from preview rep when not saved", () => {
    const ui = renderUiStateFromSettings(
      { glyphmap: [] },
      {
        board: { style: "squares", width: 2, height: 2 },
        legend: { P: { name: "piece", colour: 1 } },
        pieces: "--\n--",
        options: ["hide-labels-half", "other-flag"],
      },
    );
    expect(ui.renderOptions).to.deep.equal(["hide-labels-half"]);
  });

  it("preflight rejects incompatible style pair", () => {
    const rep = {
      board: { style: "vertex", width: 4, height: 4 },
      legend: { P: { name: "piece", colour: 1 } },
      pieces: "----\n----\n----\n----",
    };
    const render = buildRenderCustomization({
      boardStyle: "squares-stacked",
      strokeWeight: "",
      labelScale: 1,
      renderOptions: [],
      glyphMap: [],
    });
    const pf = preflightRenderCustomization(rep, render);
    expect(pf.ok).toBe(false);
    expect(pf.errors.length).to.be.greaterThan(0);
  });

  it("strips board.style for global render scope", () => {
    expect(
      stripBoardStyleForGlobalRender({
        board: { style: "vertex", strokeWeight: 2 },
        glyphmap: [["a", "b"]],
      }),
    ).to.deep.equal({
      board: { strokeWeight: 2 },
      glyphmap: [["a", "b"]],
    });
    expect(
      stripBoardStyleForGlobalRender({ board: { style: "vertex" } }),
    ).to.equal(null);
  });

  it("enforces max render JSON size", () => {
    expect(MAX_RENDER_SETTINGS_BYTES).to.equal(8192);
    const small = { glyphmap: [["a", "b"]] };
    expect(isRenderSettingsWithinSizeLimit(small)).toBe(true);
    const big = {
      glyphmap: Array.from({ length: 500 }, (_, i) => [
        `piece${i}`,
        `meeple${i}`,
        1,
      ]),
    };
    expect(renderSettingsByteSize(big)).to.be.greaterThan(MAX_RENDER_SETTINGS_BYTES);
    expect(isRenderSettingsWithinSizeLimit(big)).toBe(false);
  });
});
