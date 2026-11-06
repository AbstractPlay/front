import { expect } from "chai";
import {
  buildHandleClickUi,
  clickBoardContextFromDisplayRep,
} from "./clickBoardContext.js";

describe("clickBoardContextFromDisplayRep", () => {
  it("returns undefined when board style is missing", () => {
    expect(clickBoardContextFromDisplayRep({ board: { width: 9, height: 9 } })).to
      .be.undefined;
  });

  it("copies style and dimensions from a display rep", () => {
    expect(
      clickBoardContextFromDisplayRep({
        board: { style: "squares-diamonds", width: 11, height: 11 },
      }),
    ).to.deep.equal({
      boardStyle: "squares-diamonds",
      width: 11,
      height: 11,
    });
  });
});

describe("buildHandleClickUi", () => {
  it("combines panelId and board", () => {
    expect(
      buildHandleClickUi("main", {
        boardStyle: "go",
        width: 19,
        height: 19,
      }),
    ).to.deep.equal({
      panelId: "main",
      board: {
        boardStyle: "go",
        width: 19,
        height: 19,
      },
    });
  });

  it("returns undefined when both args are empty", () => {
    expect(buildHandleClickUi(undefined, undefined)).to.be.undefined;
  });

  it("returns inputMode-only ui when panel and board are absent", () => {
    expect(buildHandleClickUi(undefined, undefined, "tap")).to.deep.equal({
      inputMode: "tap",
    });
  });
});
