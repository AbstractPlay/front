import { describe, expect, it } from "vitest";
import {
  isRealtimeConnectionReady,
  shouldBlockArenaRealtimeActions,
  wsConnectionNoticeVariant,
} from "./wsConnection";

describe("isRealtimeConnectionReady", () => {
  const send = () => {};

  it("is ready only when status is open and wsSend is a function", () => {
    expect(isRealtimeConnectionReady({ status: "open" }, send)).toBe(true);
    expect(isRealtimeConnectionReady({ status: "open" }, null)).toBe(false);
    expect(isRealtimeConnectionReady({ status: "connecting" }, send)).toBe(
      false,
    );
  });
});

describe("shouldBlockArenaRealtimeActions", () => {
  it("blocks when not ready", () => {
    expect(
      shouldBlockArenaRealtimeActions({ status: "reconnecting" }, () => {}),
    ).toBe(true);
    expect(shouldBlockArenaRealtimeActions({ status: "open" }, () => {})).toBe(
      false,
    );
  });
});

describe("wsConnectionNoticeVariant", () => {
  it("returns null when open", () => {
    expect(wsConnectionNoticeVariant({ status: "open" })).toBeNull();
  });

  it("maps transitional states for copy", () => {
    expect(wsConnectionNoticeVariant({ status: "connecting" })).toBe(
      "connecting",
    );
    expect(wsConnectionNoticeVariant({ status: "reconnecting" })).toBe(
      "reconnecting",
    );
    expect(wsConnectionNoticeVariant({ status: "offline" })).toBe("offline");
    expect(wsConnectionNoticeVariant({ status: "idle" })).toBe("reconnecting");
  });
});