import { describe, expect, it } from "vitest";
import {
  combinedTimeoutAbandonRates,
  firstTimersCumulative,
  lstSummarize,
} from "./weekSummary";

describe("lstSummarize", () => {
  it("returns undefined for missing or empty input", () => {
    expect(lstSummarize(undefined)).toBeUndefined();
    expect(lstSummarize(null)).toBeUndefined();
    expect(lstSummarize([])).toBeUndefined();
  });

  it("summarizes non-empty series", () => {
    const result = lstSummarize([1, 2, 3, 4, 5]);
    expect(result).toMatchObject({
      avg: expect.any(Number),
      median: expect.any(Number),
    });
  });
});

describe("firstTimersCumulative", () => {
  it("returns empty array for missing or empty input", () => {
    expect(firstTimersCumulative(undefined)).toEqual([]);
    expect(firstTimersCumulative(null)).toEqual([]);
    expect(firstTimersCumulative([])).toEqual([]);
  });
});

describe("combinedTimeoutAbandonRates", () => {
  it("returns empty array when timeouts is not an array", () => {
    expect(combinedTimeoutAbandonRates(undefined)).toEqual([]);
    expect(combinedTimeoutAbandonRates(null)).toEqual([]);
  });

  it("combines timeout and abandoned series", () => {
    expect(combinedTimeoutAbandonRates([0.1, 0.2], [0.01, 0.02])).toEqual([
      0.22, 0.11,
    ]);
  });
});
