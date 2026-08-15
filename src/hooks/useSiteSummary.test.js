import { beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useStore } from "../stores";
import { useSiteSummary } from "./useSiteSummary";

describe("useSiteSummary", () => {
  beforeEach(() => {
    useStore.setState({
      summary: null,
      summaryLoadState: "pending",
    });
  });

  it("reports pending before summary is loaded", () => {
    const { result } = renderHook(() => useSiteSummary());
    expect(result.current.isPending).toBe(true);
    expect(result.current.isReady).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.summary).toBeNull();
  });

  it("reports ready when summary is loaded", () => {
    useStore.setState({
      summary: { numPlayers: 1 },
      summaryLoadState: "ready",
    });
    const { result } = renderHook(() => useSiteSummary());
    expect(result.current.isReady).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.summary).toEqual({ numPlayers: 1 });
  });

  it("reports error when load fails", () => {
    useStore.setState({
      summary: null,
      summaryLoadState: "error",
    });
    const { result } = renderHook(() => useSiteSummary());
    expect(result.current.isError).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.isReady).toBe(false);
  });
});
