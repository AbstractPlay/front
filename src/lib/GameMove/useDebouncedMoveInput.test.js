import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  MOVE_ENTRY_DEBOUNCE_MS,
  useDebouncedMoveInput,
} from "./useDebouncedMoveInput";

describe("useDebouncedMoveInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exports 500ms debounce constant", () => {
    expect(MOVE_ENTRY_DEBOUNCE_MS).toBe(500);
  });

  it("debounces onCommit for all characters", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedMoveInput({ move: { move: "" }, onCommit })
    );

    act(() => {
      result.current.handleMoveInputChange("a");
      result.current.handleMoveInputChange("ab");
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.inputValue).toBe("ab");

    act(() => {
      vi.advanceTimersByTime(MOVE_ENTRY_DEBOUNCE_MS);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("ab");
  });

  it("does not commit letters immediately without waiting", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedMoveInput({ move: { move: "" }, onCommit })
    );

    act(() => {
      result.current.handleMoveInputChange("e4");
    });

    expect(onCommit).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(MOVE_ENTRY_DEBOUNCE_MS - 1);
    });
    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onCommit).toHaveBeenCalledWith("e4");
  });

  it("handleClear commits empty string immediately and cancels pending debounce", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedMoveInput({ move: { move: "x" }, onCommit })
    );

    act(() => {
      result.current.handleMoveInputChange("pending");
    });

    act(() => {
      result.current.handleClear();
    });

    expect(result.current.inputValue).toBe("");
    expect(onCommit).toHaveBeenCalledWith("");

    act(() => {
      vi.advanceTimersByTime(MOVE_ENTRY_DEBOUNCE_MS);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("syncs inputValue when move.move changes externally", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      ({ move }) => useDebouncedMoveInput({ move, onCommit }),
      { initialProps: { move: { move: "old" } } }
    );

    expect(result.current.inputValue).toBe("old");

    rerender({ move: { move: "fromSession" } });

    expect(result.current.inputValue).toBe("fromSession");
  });
});
