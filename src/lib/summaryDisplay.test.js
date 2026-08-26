import { describe, expect, it } from "vitest";
import { formatSummaryCount } from "./summaryDisplay";

describe("formatSummaryCount", () => {
  it("formats numbers with locale grouping", () => {
    expect(formatSummaryCount(1234)).toBe((1234).toLocaleString());
  });

  it("returns fallback for null and undefined", () => {
    expect(formatSummaryCount(undefined)).toBe("??");
    expect(formatSummaryCount(null)).toBe("??");
  });

  it("accepts a custom fallback", () => {
    expect(formatSummaryCount(undefined, "—")).toBe("—");
  });
});
