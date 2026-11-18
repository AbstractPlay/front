import { describe, expect, it } from "vitest";
import {
  canAutoConfirmFromQuery,
  parseAccountConfirmQuery,
} from "./accountQueryParams";

describe("accountQueryParams", () => {
  it("parses username and code", () => {
    const q = parseAccountConfirmQuery(
      new URLSearchParams("username=ada&code=123456"),
    );
    expect(q).toEqual({ username: "ada", code: "123456" });
  });

  it("requires code for auto confirm", () => {
    expect(canAutoConfirmFromQuery({ code: "1" })).toBe(true);
    expect(canAutoConfirmFromQuery({ username: "ada" })).toBe(false);
  });
});