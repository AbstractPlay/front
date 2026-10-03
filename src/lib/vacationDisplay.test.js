import { expect } from "chai";
import {
  datetimeLocalToMs,
  formatVacationDurationMs,
  msToDatetimeLocalValue,
} from "./vacationDisplay";

describe("vacationDisplay", () => {
  it("formats duration with days and hours", () => {
    expect(formatVacationDurationMs(3 * 86_400_000 + 5 * 3_600_000)).to.equal(
      "3d 5h"
    );
  });

  it("round-trips datetime-local in local timezone", () => {
    const ms = Date.parse("2026-07-01T15:30:00");
    const local = msToDatetimeLocalValue(ms);
    expect(datetimeLocalToMs(local)).to.equal(ms);
  });
});
