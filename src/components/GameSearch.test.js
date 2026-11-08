import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import GameSearch from "./GameSearch";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal()),
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("../lib/gameOptions", async (importOriginal) => ({
  ...(await importOriginal()),
  buildGameBrowseEntries: () => [
    { id: "cargo", name: "Cargo", designers: "Ann" },
    { id: "go", name: "Go", designers: "" },
    { id: "gorgon", name: "Gorgon", designers: "Bea" },
  ],
}));

function CurrentPath() {
  return <span data-testid="path">{useLocation().pathname}</span>;
}

function setup(closeBurger = vi.fn()) {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <GameSearch closeBurger={closeBurger} />
      <CurrentPath />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole("button", { name: "a11y.searchGames" }));
  return { input: screen.getByRole("combobox"), closeBurger };
}

const path = () => screen.getByTestId("path").textContent;
const type = (input, value) => fireEvent.change(input, { target: { value } });

describe("GameSearch", () => {
  it("opens a focused search box and closes the burger menu", () => {
    const { input, closeBurger } = setup();

    expect(input).toHaveFocus();
    expect(closeBurger).toHaveBeenCalled();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("lists matching games as links, best title match first", () => {
    const { input } = setup();

    type(input, "go");

    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.getAttribute("href"))).toEqual([
      "/games/go",
      "/games/gorgon",
      "/games/cargo",
    ]);
  });

  it("navigates to the top result on Enter and closes", () => {
    const { input } = setup();

    type(input, "go");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(path()).toBe("/games/go");
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("moves the selection with the arrow keys", () => {
    const { input } = setup();

    type(input, "go");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(path()).toBe("/games/gorgon");
  });

  it("wraps from the first result to the last", () => {
    const { input } = setup();

    type(input, "go");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(path()).toBe("/games/cargo");
  });

  it("navigates when a result is clicked", () => {
    const { input } = setup();

    type(input, "gorgon");
    fireEvent.click(screen.getByRole("option", { name: /Gorgon/ }));

    expect(path()).toBe("/games/gorgon");
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("shows an empty state and ignores Enter when nothing matches", () => {
    const { input } = setup();

    type(input, "zzz");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("gamePicker.noResults")).toBeInTheDocument();
    expect(path()).toBe("/");
  });

  it("closes on Escape, clears the query and refocuses the button", () => {
    const { input } = setup();
    const button = screen.getByRole("button", { name: "a11y.searchGames" });

    type(input, "go");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(screen.getByRole("combobox")).toHaveValue("");
  });
});
