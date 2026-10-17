import { describe, expect, it } from "vitest";
import {
  applySeatRotateToComposite,
  isCompositeRenderRep,
  isMultiFrameRenderRep,
  stackExpandingForRender,
  usesStackExpanding,
} from "./renderOutput.js";

const miniRep = (renderer = "default") => ({
  board: { style: "squares", width: 2, height: 2 },
  legend: { A: { name: "piece", paint: { fill: 1 } } },
  pieces: "AA\nAA",
  renderer,
});

const compositeFixture = {
  kind: "composite",
  layout: { arrangement: "row", gap: 1 },
  panels: [
    { id: "a", render: miniRep("default") },
    { id: "b", render: miniRep("stacking-expanding") },
  ],
};

describe("renderOutput", () => {
  it("detects composite vs frames", () => {
    expect(isCompositeRenderRep(compositeFixture)).to.equal(true);
    expect(isCompositeRenderRep(miniRep())).to.equal(false);
    expect(isMultiFrameRenderRep([miniRep(), miniRep()])).to.equal(true);
    expect(isCompositeRenderRep([miniRep()])).to.equal(false);
  });

  it("stackExpandingForRender requires flag and matching renderer", () => {
    const engine = { getFlags: () => ["stacking-expanding"] };
    expect(
      stackExpandingForRender("volcano", engine, miniRep("stacking-3D")),
    ).to.equal(false);
    expect(
      stackExpandingForRender("volcano", engine, miniRep("stacking-expanding")),
    ).to.equal(true);
    expect(
      stackExpandingForRender("volcano", { getFlags: () => [] }, miniRep("stacking-expanding")),
    ).to.equal(false);
  });

  it("usesStackExpanding on composite panels or last frame", () => {
    expect(usesStackExpanding(compositeFixture)).to.equal(true);
    expect(
      usesStackExpanding({
        ...compositeFixture,
        panels: [
          { id: "a", render: miniRep("default") },
          { id: "b", render: miniRep("default") },
        ],
      }),
    ).to.equal(false);
    expect(
      usesStackExpanding([miniRep("plain"), miniRep("stacking-expanding")]),
    ).to.equal(true);
    expect(usesStackExpanding(miniRep("plain"))).to.equal(false);
  });

  it("applySeatRotateToComposite bumps panel rotate", () => {
    const out = applySeatRotateToComposite(
      {
        kind: "composite",
        layout: { arrangement: "row" },
        panels: [{ id: "p", rotate: 90, render: miniRep() }],
      },
      90,
    );
    expect(out.panels[0].rotate).to.equal(180);
  });
});
