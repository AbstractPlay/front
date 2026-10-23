import { describe, it, expect } from "vitest";
import {
  isConcreteMetaGame,
  tournamentDetailPathActive,
  tournamentDetailPathArchived,
  tournamentDetailPathFromGameRef,
} from "./tournamentRoutes.js";

describe("tournamentRoutes", () => {
  const id = "c3174304-9e7f-464b-830c-80d90e1e3e49";

  it("isConcreteMetaGame rejects placeholder", () => {
    expect(isConcreteMetaGame("undefined")).toBe(false);
    expect(isConcreteMetaGame("go")).toBe(true);
  });

  it("builds active and archived paths", () => {
    expect(tournamentDetailPathActive(id)).toBe(`/tournament/${id}`);
    expect(tournamentDetailPathArchived(id, "saltire")).toBe(
      `/tournament/saltire/${id}`
    );
  });

  it("parses game tournament ref", () => {
    expect(tournamentDetailPathFromGameRef("saltire#abc", "go", "1")).toBe(
      "/tournament/saltire/abc"
    );
  });
});
