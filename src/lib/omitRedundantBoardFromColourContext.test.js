import { describe, expect, it } from "vitest";
import { omitRedundantBoardFromColourContext } from "./omitRedundantBoardFromColourContext.js";

describe("omitRedundantBoardFromColourContext", () => {
  it("removes board when it equals background", () => {
    expect(
      omitRedundantBoardFromColourContext({
        background: "#fff",
        board: "#fff",
        strokes: "#000",
      }),
    ).toEqual({ background: "#fff", strokes: "#000" });
  });

  it("compares hex case-insensitively", () => {
    expect(
      omitRedundantBoardFromColourContext({
        background: "#FFF",
        board: "#fff",
      }),
    ).toEqual({ background: "#FFF" });
  });

  it("keeps board when it differs from background", () => {
    const ctx = { background: "#fff", board: "#ccc" };
    expect(omitRedundantBoardFromColourContext(ctx)).toEqual(ctx);
  });
});
