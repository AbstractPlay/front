import { vi } from "vitest";

vi.mock("../i18n.js", () => ({
  default: {
    t: (key) => key,
    isInitialized: true,
    language: "en",
  },
}));

import { expect } from "chai";
import {
  resolveSidebarScores,
  resolveSidebarStatuses,
} from "./resolveSidebarStatus";

describe("resolveSidebarStatus", () => {
  const players = [
    { name: "Alice", id: "u1" },
    { name: "Bob", id: "u2" },
  ];
  const users = {};
  const t = (key, params) => {
    if (key === "apgames:status._player") {
      return `${params?.player}`;
    }
    if (key === "apgames:status.meg.OFFENSE") {
      return "Offensive player";
    }
    if (key === "apgames:status.meg.COUNTDOWN") {
      return "Plies remaining";
    }
    return key;
  };

  it("resolves Meg-style structured status rows to display names", () => {
    const statuses = [
      {
        key: {
          textKey: "apgames:status.meg.OFFENSE",
          actor: { kind: "none" },
        },
        value: [
          {
            textKey: "apgames:status._player",
            actor: { kind: "seat", seat: 1 },
          },
        ],
      },
      {
        key: {
          textKey: "apgames:status.meg.COUNTDOWN",
          actor: { kind: "none" },
        },
        value: ["7"],
      },
    ];
    const resolved = resolveSidebarStatuses(statuses, players, users, t);
    expect(resolved[0].key).to.equal("Offensive player");
    expect(resolved[0].value[0]).to.equal("Alice");
    expect(resolved[1].value[0]).to.equal("7");
  });

  it("resolves plain namespaced status keys (e.g. agofmars bag count)", () => {
    const statuses = [
      {
        key: "apgames:status.agofmars.bagCount",
        value: ["63"],
      },
    ];
    const bagT = (key) =>
      key === "apgames:status.agofmars.bagCount" ? "Tiles in bag" : key;
    const resolved = resolveSidebarStatuses(statuses, players, users, bagT);
    expect(resolved[0].key).to.equal("Tiles in bag");
    expect(resolved[0].value[0]).to.equal("63");
  });

  it("leaves glyph status values unchanged", () => {
    const glyph = { name: "piece", colour: 2 };
    const statuses = [
      {
        key: "Phase",
        value: [glyph],
      },
    ];
    const resolved = resolveSidebarStatuses(statuses, players, users, t);
    expect(resolved[0].value[0]).to.equal(glyph);
  });

  it("leaves composite legend and tagged legend status values unchanged", () => {
    const composite = [
      { name: "piece-square-borderless", colour: 1 },
      { name: "piece-circle-borderless", colour: 2 },
    ];
    const legendTagged = { kind: "legend", entry: composite };
    const polymatrix = [[1, 0], [0, 1]];
    const statuses = [
      { key: "Hand", value: [composite] },
      { key: "Tagged", value: [legendTagged] },
      { key: "Matrix", value: [polymatrix] },
    ];
    const resolved = resolveSidebarStatuses(statuses, players, users, t);
    expect(resolved[0].value[0]).to.equal(composite);
    expect(resolved[1].value[0]).to.equal(legendTagged);
    expect(resolved[2].value[0]).to.equal(polymatrix);
  });

  it("resolves structured score block names and cells", () => {
    const scores = [
      {
        name: {
          textKey: "apgames:status.SCORES",
          actor: { kind: "none" },
        },
        scores: [10, 20],
      },
    ];
    const scoreT = (key) => (key === "apgames:status.SCORES" ? "Scores" : key);
    const resolved = resolveSidebarScores(scores, players, users, scoreT);
    expect(resolved[0].name).to.equal("Scores");
    expect(resolved[0].scores).to.deep.equal([10, 20]);
  });

  it("resolves list score cells entry by entry, leaving glyphs unchanged", () => {
    const glyph = { glyph: "piece", colour: 3 };
    const scores = [
      {
        name: "Colours",
        scores: [
          [
            glyph,
            {
              textKey: "apgames:status._player",
              actor: { kind: "seat", seat: 2 },
            },
          ],
          [],
        ],
        spoiler: true,
      },
    ];
    const resolved = resolveSidebarScores(scores, players, users, t);
    expect(resolved[0].scores[0][0]).to.equal(glyph);
    expect(resolved[0].scores[0][1]).to.equal("Bob");
    expect(resolved[0].scores[1]).to.deep.equal([]);
    expect(resolved[0].spoiler).to.equal(true);
  });
});
