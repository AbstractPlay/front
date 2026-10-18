import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import GameCommentShort, { clearGameChatDraft } from "./GameCommentShort";

describe("GameCommentShort", () => {
  beforeEach(() => {
    clearGameChatDraft("game-1");
  });

  it("keeps unsent text when the composer unmounts and remounts", () => {
    const handleSubmit = vi.fn();

    const { unmount } = render(
      <GameCommentShort
        gameid="game-1"
        handleSubmit={handleSubmit}
        tooMuch={false}
        commentingCompletedGame={false}
      />
    );

    const field = screen.getByPlaceholderText("Comment");
    fireEvent.change(field, { target: { value: "hello there" } });

    unmount();

    render(
      <GameCommentShort
        gameid="game-1"
        handleSubmit={handleSubmit}
        tooMuch={false}
        commentingCompletedGame={false}
      />
    );

    expect(screen.getByPlaceholderText("Comment")).toHaveValue("hello there");
  });

  it("clears the draft after submit", () => {
    const handleSubmit = vi.fn();

    render(
      <GameCommentShort
        gameid="game-1"
        handleSubmit={handleSubmit}
        tooMuch={false}
        commentingCompletedGame={false}
      />
    );

    const field = screen.getByPlaceholderText("Comment");
    fireEvent.change(field, { target: { value: "posted" } });
    fireEvent.click(screen.getByRole("button", { name: "Comment" }));

    expect(handleSubmit).toHaveBeenCalledWith("posted");
    expect(screen.getByPlaceholderText("Comment")).toHaveValue("");
  });
});
