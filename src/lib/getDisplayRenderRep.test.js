import { describe, expect, it } from "vitest";
import { getCompatibleStyles } from "@abstractplay/renderer";
import { getDisplayRenderRep } from "./getDisplayRenderRep.js";

const checkeredRep = {
  board: { style: "squares-checkered", width: 4, height: 4 },
  legend: { P: { name: "piece", colour: 1 } },
  pieces: "----\n----\n----\n----",
};

describe("getDisplayRenderRep", () => {
  it("applies render.options when there is no board chrome override", () => {
    const display = getDisplayRenderRep(checkeredRep, {
      board: null,
      options: ["hide-labels"],
    });
    expect(display.options).to.deep.equal(["hide-labels"]);
    expect(display.board.style).to.equal("squares-checkered");
  });

  it("applies board style and options together", () => {
    const display = getDisplayRenderRep(checkeredRep, {
      board: { style: "vertex" },
      options: ["hide-star-points"],
    });
    expect(display.board.style).to.equal("vertex");
    expect(display.options).to.deep.equal(["hide-star-points"]);
  });

  it("applies labelScale on pegboard without style swap", () => {
    const pegRep = {
      board: { style: "pegboard", width: 4, height: 4 },
      legend: { P: { name: "piece", colour: 1 } },
      pieces: "----\n----\n----\n----",
    };
    const display = getDisplayRenderRep(pegRep, {
      board: { labelScale: 2, style: "vertex" },
      options: ["hide-labels"],
    });
    expect(display.board.style).to.equal("pegboard");
    expect(display.board.labelScale).to.equal(2);
    expect(display.options).to.deep.equal(["hide-labels"]);
  });

  it("swaps hex-of-hex to hex-of-tri when renderer registry allows", () => {
    const allowed = getCompatibleStyles("hex-of-hex");
    if (!allowed.includes("hex-of-tri")) {
      expect(allowed).to.not.include("hex-of-tri");
      return;
    }
    const hexRep = {
      board: { style: "hex-of-hex", minWidth: 3, maxWidth: 5 },
      legend: { P: { name: "piece", colour: 1 } },
      pieces: "---\n----\n-----",
    };
    const display = getDisplayRenderRep(hexRep, {
      board: { style: "hex-of-tri" },
    });
    expect(display.board.style).to.equal("hex-of-tri");
    expect(display.board.minWidth).to.equal(3);
    expect(display.board.maxWidth).to.equal(5);
  });
});
