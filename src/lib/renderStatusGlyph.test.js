import { vi } from "vitest";

vi.mock("@abstractplay/renderer", () => ({
  renderSheetGlyph: vi.fn(() => "<svg>sheet</svg>"),
  renderLegendGlyph: vi.fn(() => "<svg>legend</svg>"),
}));

import { expect } from "chai";
import {
  renderLegendGlyph,
  renderSheetGlyph,
} from "@abstractplay/renderer";
import {
  isStatusGlyphLike,
  renderStatusGlyphSvg,
  stashEntryToStatusGlyph,
} from "./renderStatusGlyph";

describe("renderStatusGlyph", () => {
  beforeEach(() => {
    renderSheetGlyph.mockClear();
    renderLegendGlyph.mockClear();
  });

  it("isStatusGlyphLike detects legacy shorthand and tagged shapes", () => {
    expect(isStatusGlyphLike({ glyph: "piece", colour: 1 })).to.equal(true);
    expect(
      isStatusGlyphLike({ kind: "sheet", name: "piece", colour: 2 }),
    ).to.equal(true);
    expect(
      isStatusGlyphLike({ kind: "legend", entry: { name: "piece", colour: 1 } }),
    ).to.equal(true);
    expect(isStatusGlyphLike([{ name: "piece", colour: 1 }])).to.equal(true);
    expect(isStatusGlyphLike([[1, 0], [1, 2]])).to.equal(true);
    expect(
      isStatusGlyphLike({ piece: "cube", height: 30, colour: 1 }),
    ).to.equal(true);
    expect(isStatusGlyphLike("apgames:status.foo")).to.equal(false);
    expect(
      isStatusGlyphLike({
        textKey: "apgames:status._player",
        actor: { kind: "seat", seat: 1 },
      }),
    ).to.equal(false);
  });

  it("renderStatusGlyphSvg uses renderSheetGlyph for sheet mode and legacy shorthand", () => {
    const opts = { svgid: "t" };
    renderStatusGlyphSvg(
      { kind: "sheet", name: "piece", colour: 3 },
      opts,
    );
    expect(renderSheetGlyph.mock.calls).to.deep.equal([["piece", 3, opts]]);
    renderStatusGlyphSvg({ glyph: "orb", colour: 1 }, opts);
    expect(renderSheetGlyph.mock.calls[1]).to.deep.equal(["orb", 1, opts]);
  });

  it("renderStatusGlyphSvg uses renderLegendGlyph for legend entries", () => {
    const entry = [{ name: "piece-square-borderless", colour: 1 }];
    const opts = { svgid: "c" };
    renderStatusGlyphSvg({ kind: "legend", entry }, opts);
    expect(renderLegendGlyph.mock.calls[0]).to.deep.equal([entry, opts]);
    renderStatusGlyphSvg(entry, opts);
    expect(renderLegendGlyph.mock.calls[1]).to.deep.equal([entry, opts]);
  });

  it("stashEntryToStatusGlyph maps stash glyphs for renderStatusGlyphSvg", () => {
    const composite = [{ name: "piece", colour: 1 }];
    expect(stashEntryToStatusGlyph({ glyph: composite })).to.equal(composite);
    expect(stashEntryToStatusGlyph({ glyph: { name: "piece", colour: 2 } })).to.deep.equal({
      kind: "sheet",
      name: "piece",
      colour: 2,
    });
    const taggedLegend = {
      kind: "legend",
      entry: composite,
    };
    expect(stashEntryToStatusGlyph({ glyph: taggedLegend })).to.equal(taggedLegend);
  });

  it("renderStatusGlyphSvg renders stash entries via stashEntryToStatusGlyph", () => {
    const opts = { svgid: "stash" };
    const composite = [{ name: "piece-square-borderless", colour: 1 }];
    renderStatusGlyphSvg(
      stashEntryToStatusGlyph({
        count: 1,
        glyph: { kind: "legend", entry: composite },
        movePart: "",
      }),
      opts,
    );
    expect(renderLegendGlyph.mock.calls[0]).to.deep.equal([composite, opts]);

    renderStatusGlyphSvg(
      stashEntryToStatusGlyph({
        count: 2,
        glyph: { name: "hline", colour: 3 },
        movePart: "",
      }),
      opts,
    );
    expect(renderSheetGlyph.mock.calls[0]).to.deep.equal(["hline", 3, opts]);
  });
});
