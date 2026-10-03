import { expect } from "chai";
import { shouldCommitBoardRender } from "./boardRenderCommit";

describe("shouldCommitBoardRender", () => {
  const repA = { board: "a" };
  const repB = { board: "b" };

  it("commits when generation and renderrep still match", () => {
    expect(
      shouldCommitBoardRender({
        generationAtStart: 2,
        generationNow: 2,
        renderrepAtStart: repA,
        renderrepLatest: repA,
      })
    ).to.be.true;
  });

  it("skips when a newer effect run bumped the generation", () => {
    expect(
      shouldCommitBoardRender({
        generationAtStart: 1,
        generationNow: 2,
        renderrepAtStart: repA,
        renderrepLatest: repA,
      })
    ).to.be.false;
  });

  it("skips when renderrep was superseded before the async work finished", () => {
    expect(
      shouldCommitBoardRender({
        generationAtStart: 3,
        generationNow: 3,
        renderrepAtStart: repA,
        renderrepLatest: repB,
      })
    ).to.be.false;
  });
});
