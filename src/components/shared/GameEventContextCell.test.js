import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GameEventContextCell } from "./GameEventContextCell";

describe("GameEventContextCell", () => {
  it("links ladder before tournament", () => {
    render(
      <MemoryRouter>
        <GameEventContextCell
          ladderId="l1"
          tournament="t1"
          metaGame="go"
        />
      </MemoryRouter>
    );
    const link = screen.getByRole("link");
    assert.equal(link.getAttribute("href"), "/ladder/l1");
  });
});
