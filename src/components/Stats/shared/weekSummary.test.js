import { describe, expect, it } from "vitest";
import {
  combinedTimeoutAbandonRates,
  firstTimersCumulative,
  lstSummarize,
  hoursPerTrendSeries,
  withoutIncompleteWeek,
} from "./weekSummary";

describe("withoutIncompleteWeek", () => {
  it("returns empty array for missing or empty input", () => {
    expect(withoutIncompleteWeek(undefined)).toEqual([]);
    expect(withoutIncompleteWeek(null)).toEqual([]);
    expect(withoutIncompleteWeek([])).toEqual([]);
  });

  it("drops the trailing week bucket", () => {
    expect(withoutIncompleteWeek([10, 20, 5])).toEqual([10, 20]);
  });
});

describe("hoursPerTrendSeries", () => {
  it("omits the incomplete week and caps at 52 weeks", () => {
    const weeks = Array.from({ length: 60 }, (_, i) => i + 1);
    expect(hoursPerTrendSeries(weeks)).toEqual(weeks.slice(7, 59));
  });
});

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

  it("combines timeout and abandoned series in week order", () => {
    expect(combinedTimeoutAbandonRates([0.1, 0.2], [0.01, 0.02])).toEqual([
      0.11, 0.22,
    ]);
  });
});
