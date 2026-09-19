import { describe, expect, it } from "vitest";
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
});
