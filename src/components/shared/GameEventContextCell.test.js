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

  it("links tournament when no ladder", () => {
    render(
      <MemoryRouter>
        <GameEventContextCell
          tournament="go#tid-1"
          metaGame="go"
        />
      </MemoryRouter>
    );
    const link = screen.getByRole("link");
    assert.equal(link.getAttribute("href"), "/tournament/go/tid-1");
  });

  it("links organized event when no ladder or tournament", () => {
    render(
      <MemoryRouter>
        <GameEventContextCell event="evt-99" metaGame="go" />
      </MemoryRouter>
    );
    const link = screen.getByRole("link");
    assert.equal(link.getAttribute("href"), "/event/evt-99");
  });
});
