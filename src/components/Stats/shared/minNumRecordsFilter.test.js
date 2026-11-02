import { describe, expect, it } from "vitest";
import {
  parseMinNumRecords,
  rowMeetsMinNumRecords,
} from "./minNumRecordsFilter";

describe("parseMinNumRecords", () => {
  it("treats invalid and negative values as zero", () => {
    expect(parseMinNumRecords(undefined)).toBe(0);
    expect(parseMinNumRecords("")).toBe(0);
    expect(parseMinNumRecords("x")).toBe(0);
    expect(parseMinNumRecords(-3)).toBe(0);
  });

  it("floors positive numbers", () => {
    expect(parseMinNumRecords("12.9")).toBe(12);
    expect(parseMinNumRecords(5)).toBe(5);
  });
});

describe("rowMeetsMinNumRecords", () => {
  it("passes all rows when minimum is zero", () => {
    expect(rowMeetsMinNumRecords({ n: 0 }, 0)).toBe(true);
    expect(rowMeetsMinNumRecords({ n: 1 }, 0)).toBe(true);
  });

  it("requires n at or above the threshold", () => {
    expect(rowMeetsMinNumRecords({ n: 9 }, 10)).toBe(false);
    expect(rowMeetsMinNumRecords({ n: 10 }, 10)).toBe(true);
  });
});
