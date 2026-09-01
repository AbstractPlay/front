import { describe, expect, it } from "vitest";
import { initialNonGroupVariants } from "./variantSelectionInit";

describe("initialNonGroupVariants", () => {
  it("checks variants with default true", () => {
    expect(
      initialNonGroupVariants([
        { uid: "courts", default: true },
        { uid: "mega" },
      ]),
    ).toEqual({ courts: true, mega: false });
  });
});
