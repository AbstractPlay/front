import { expect } from "chai";
import { resolveRenderLabels } from "./resolveRenderLabels";

describe("resolveRenderLabels", () => {
  const players = [
    { name: "Alice", id: "u1" },
    { name: "Bob", id: "u2" },
  ];
  const users = {};
  const t = (key, params) => {
    if (key === "test:STASH") {
      return `${params?.player}'s stash`;
    }
    return key;
  };

  it("resolves structured area labels to display names", () => {
    const rep = {
      areas: [
        {
          type: "pieces",
          label: {
            textKey: "test:STASH",
            actor: { kind: "seat", seat: 2 },
          },
          pieces: ["A1"],
        },
      ],
      legend: { A1: "piece" },
    };
    const resolved = resolveRenderLabels(rep, players, users, t);
    expect(resolved.areas[0].label).to.equal("Bob's stash");
  });

  it("does not rewrite unrelated legend keys containing player numbers", () => {
    const rep = {
      legend: { "player 1 token": { name: "piece" } },
      areas: [
        {
          type: "pieces",
          label: "Neutral pile",
          pieces: ["player 1 token"],
        },
      ],
    };
    const resolved = resolveRenderLabels(rep, players, users, t, {
      legacyReplaceNames: false,
    });
    expect(resolved.legend["player 1 token"]).to.deep.equal({ name: "piece" });
    expect(resolved.areas[0].pieces[0]).to.equal("player 1 token");
  });

  it("still applies legacy replaceNames to plain-string labels", () => {
    const rep = {
      areas: [
        {
          type: "pieces",
          label: "Player 1 hand",
          pieces: ["A1"],
        },
      ],
    };
    const resolved = resolveRenderLabels(rep, players, users, t);
    expect(resolved.areas[0].label).to.equal("Alice hand");
  });

  it("resolves streetcar-style taken area labels", () => {
    const rep = {
      areas: [
        {
          type: "pieces",
          label: {
            textKey: "apgames:validation.streetcar.TAKEN_LABEL",
            actor: { kind: "seat", seat: 1 },
          },
          pieces: ["E"],
        },
      ],
    };
    const streetcarT = (key, params) => {
      if (key === "apgames:validation.streetcar.TAKEN_LABEL") {
        return `${params?.player}'s housing limits`;
      }
      return key;
    };
    const resolved = resolveRenderLabels(rep, players, users, streetcarT);
    expect(resolved.areas[0].label).to.equal("Alice's housing limits");
  });

  it("resolves entropy board labels and board markers", () => {
    const rep = {
      board: {
        style: "squares",
        boardOne: {
          label: {
            textKey: "test:STASH",
            actor: { kind: "seat", seat: 1 },
          },
        },
        markers: [
          {
            type: "label",
            label: {
              textKey: "test:STASH",
              actor: { kind: "seat", seat: 2 },
            },
            points: [
              { row: 0, col: 0 },
              { row: 0, col: 1 },
            ],
          },
        ],
      },
    };
    const resolved = resolveRenderLabels(rep, players, users, t);
    expect(resolved.board.boardOne.label).to.equal("Alice's stash");
    expect(resolved.board.markers[0].label).to.equal("Bob's stash");
  });
});
