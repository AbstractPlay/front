import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMoveEntryInput } from "./useMoveEntryInput";

describe("useMoveEntryInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not call onCommit while typing in textarea mode", () => {
    const onCommit = vi.fn();
    const onDraftChange = vi.fn();
    const { result } = renderHook(() =>
      useMoveEntryInput({
        moveDraft: "ab",
        committedMove: "",
        onDraftChange,
        onCommit,
        textareaMode: true,
      })
    );

    act(() => {
      result.current.handleMoveInputChange("abc");
    });

    expect(onDraftChange).toHaveBeenCalledWith("abc");
    expect(onCommit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commitDraft calls onCommit with current draft", () => {
    const onCommit = vi.fn();
    const onDraftChange = vi.fn();
    const { result, rerender } = renderHook(
      (draft) =>
        useMoveEntryInput({
          moveDraft: draft,
          committedMove: "",
          onDraftChange,
          onCommit,
          textareaMode: true,
        }),
      { initialProps: "line one" }
    );

    act(() => {
      result.current.commitDraft();
    });

    expect(onCommit).toHaveBeenCalledWith("line one");

    rerender("line two");
    act(() => {
      result.current.commitDraft();
    });
    expect(onCommit).toHaveBeenLastCalledWith("line two");
  });
});
