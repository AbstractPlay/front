import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StandingChallenges from "./StandingChallenges";
import { useStore } from "../stores";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal()),
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("../hooks/useAuthSession", () => ({
  useAuthSession: () => ({ status: "anonymous" }),
}));

vi.mock("./Me/ChallengeResponseModal", () => ({ default: () => null }));

const challenge = {
  id: "challenge-1",
  metaGame: "homeworlds",
  challenger: { id: "player-1", name: "Player One" },
  players: [{ id: "player-1", name: "Player One" }],
  variants: [],
  numPlayers: 2,
  seating: "random",
  rated: true,
  clockStart: 72,
  clockInc: 24,
  clockMax: 240,
};

describe("StandingChallenges (site-wide)", () => {
  beforeEach(() => {
    useStore.setState({ globalMe: null, users: [] });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([challenge])))
    );
  });

  it("links the game name to the game page", async () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/challenges"]}>
          <StandingChallenges />
        </MemoryRouter>
      </HelmetProvider>
    );

    const link = await screen.findByRole("link", { name: "Homeworlds" });
    expect(link).toHaveAttribute("href", "/games/homeworlds");
  });
});
