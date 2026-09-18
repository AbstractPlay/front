import { describe, expect, it } from "vitest";
import { validateChallengeResponseArgs } from "./challengeResponseArgs";

describe("validateChallengeResponseArgs", () => {
  const challenge = {
    id: "abc",
    metaGame: "chess",
    standing: false,
  };

  it("accepts a valid challenge and boolean response", () => {
    expect(validateChallengeResponseArgs(challenge, true)).toEqual({
      id: "abc",
      metaGame: "chess",
      standing: false,
    });
    expect(
      validateChallengeResponseArgs({ ...challenge, standing: true }, false).standing
    ).toBe(true);
  });

  it("rejects a boolean passed as challenge (incomplete handler call)", () => {
    expect(() => validateChallengeResponseArgs(false, false)).toThrow(
      /first argument/
    );
  });

  it("rejects missing id or metaGame", () => {
    expect(() => validateChallengeResponseArgs({ metaGame: "x" }, true)).toThrow(
      /challenge\.id/
    );
    expect(() => validateChallengeResponseArgs({ id: "x" }, true)).toThrow(
      /challenge\.metaGame/
    );
  });

  it("rejects non-boolean response", () => {
    expect(() => validateChallengeResponseArgs(challenge, undefined)).toThrow(
      /second argument/
    );
  });
});
