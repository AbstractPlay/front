import { describe, expect, it } from "vitest";
import { fitAvatarSvgToContainer } from "./createAvatarSvg";

describe("fitAvatarSvgToContainer", () => {
  it("replaces fixed dimensions with percentage sizing", () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="96" height="96"></svg>';
    expect(fitAvatarSvgToContainer(input)).toBe(
      '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>'
    );
  });
});
