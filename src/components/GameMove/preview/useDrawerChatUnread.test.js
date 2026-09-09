import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrawerChatUnread } from "./useDrawerChatUnread";

describe("useDrawerChatUnread", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not flag historical messages on first visit", () => {
    const session = {
      gameID: "game-1",
      chatComments: [{ timeStamp: 1000, comment: "gg" }],
    };

    const { result } = renderHook(() =>
      useDrawerChatUnread(session, { tab: "status", open: true })
    );

    expect(result.current).toBe(false);
  });

  it("flags messages newer than the last seen timestamp", () => {
    localStorage.setItem("gameMoveChatSeen:game-1", "1000");

    const session = {
      gameID: "game-1",
      chatComments: [{ timeStamp: 2000, comment: "hello" }],
    };

    const { result } = renderHook(() =>
      useDrawerChatUnread(session, { tab: "status", open: true })
    );

    expect(result.current).toBe(true);
  });

  it("clears unread when the chat tab is opened", () => {
    localStorage.setItem("gameMoveChatSeen:game-1", "1000");

    const session = {
      gameID: "game-1",
      chatComments: [{ timeStamp: 2000, comment: "hello" }],
    };

    const { result, rerender } = renderHook(
      ({ tab, open }) => useDrawerChatUnread(session, { tab, open }),
      { initialProps: { tab: "status", open: true } }
    );

    expect(result.current).toBe(true);

    act(() => {
      rerender({ tab: "chat", open: true });
    });

    expect(result.current).toBe(false);
    expect(localStorage.getItem("gameMoveChatSeen:game-1")).toBe("2000");
  });
});
