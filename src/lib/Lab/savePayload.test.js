import { vi } from "vitest";
import {
  parsePlaygroundSaveBody,
  bodyFromLocalSaveRecord,
  toLocalSaveRecord,
  playgroundSaveBodyToJson,
  playgroundSaveBodyFromJson,
} from "./savePayload";

vi.mock("./exploration", () => ({
  sanitizeFocus: (_nodes, focus) => focus,
  serializeSessionExploration: () => null,
  serializeMainLineAnnotations: () => null,
  getMainLineTipState: () => '{"game":"chess"}',
}));

describe("parsePlaygroundSaveBody", () => {
  it("round-trips through JSON", () => {
    const original = {
      version: 1,
      state: '{"game":"chess"}',
      variants: [],
      playerCount: 2,
      focus: { moveNumber: 0, exPath: [] },
      exploration: null,
      explorationFormat: 2,
      gameSettings: {},
    };
    const json = playgroundSaveBodyToJson(original);
    expect(playgroundSaveBodyFromJson(json)).toEqual(
      parsePlaygroundSaveBody(original)
    );
  });

  it("rejects missing state", () => {
    expect(() => parsePlaygroundSaveBody({})).toThrow(/missing state/i);
  });
});

describe("local save record compat", () => {
  it("reads legacy flattened records", () => {
    const legacy = {
      id: "abc",
      name: "Test",
      metaGame: "chess",
      savedAt: 1000,
      state: '{"game":"chess"}',
      variants: ["v1"],
      playerCount: 2,
      exploration: [[{ move: "e4", children: [] }]],
      gameSettings: {},
    };
    const body = bodyFromLocalSaveRecord(legacy);
    expect(body.state).toBe(legacy.state);
    expect(body.variants).toEqual(["v1"]);
    const roundTrip = toLocalSaveRecord({
      id: legacy.id,
      name: legacy.name,
      metaGame: legacy.metaGame,
      savedAt: legacy.savedAt,
      body,
    });
    expect(roundTrip.state).toBe(legacy.state);
    expect(roundTrip.id).toBe("abc");
  });
});
