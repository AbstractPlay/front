import { expect } from "chai";
import {
  buildBoardRenderCacheKey,
  cloneRenderedFrames,
  createBoardRenderCache,
} from "./boardRenderCache";

describe("boardRenderCache", () => {
  it("builds distinct keys for different focus positions", () => {
    const base = {
      displaySettings: { display: "default", rotate: 0, annotate: false },
      metaGame: "chess",
      boardKey: "board-1",
      colorMode: "light",
      canExplore: true,
    };
    const a = buildBoardRenderCacheKey({
      ...base,
      focus: { moveNumber: 1, exPath: [] },
    });
    const b = buildBoardRenderCacheKey({
      ...base,
      focus: { moveNumber: 2, exPath: [] },
    });
    expect(a).to.not.equal(b);
  });

  it("clones rendered SVG nodes for DOM reuse", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("data-test", "frame");
    const [clone] = cloneRenderedFrames([svg]);
    expect(clone).to.not.equal(svg);
    expect(clone.getAttribute("data-test")).to.equal("frame");
  });

  it("evicts oldest cache entries when over capacity", () => {
    const cache = createBoardRenderCache();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const frames = [svg];

    for (let i = 0; i < 65; i++) {
      cache.set(`key-${i}`, frames);
    }

    expect(cache.get("key-0")).to.equal(undefined);
    expect(cache.get("key-64")).to.deep.equal(frames);
  });
});
