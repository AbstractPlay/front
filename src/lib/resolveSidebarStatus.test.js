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
});
