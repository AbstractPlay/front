import { expect } from "chai";
import {
  arenaListTableHref,
  arenaPlayPath,
  arenaPlayPathFromLegacyMove,
  arenaTablePath,
  arenaWatchPath,
  playLocationMatchesTarget,
} from "./arenaRoutes.js";

describe("arenaPlayPathFromLegacyMove", () => {
  const id = "8ad77663-7737-4f57-a35f-b3bafba200d9";

  it("preserves move and adds live layout", () => {
    expect(
      arenaPlayPathFromLegacyMove("abande", id, {
        layout: "live",
        search: "?move=6",
      }),
    ).to.equal(
      `/arena/play/abande/${encodeURIComponent(id)}?layout=live&move=6`,
    );
  });

  it("matches locations regardless of query param order", () => {
    const id = "tid";
    const target = arenaPlayPathFromLegacyMove("abande", id, {
      layout: "live",
      search: "?move=6",
    });
    expect(
      playLocationMatchesTarget(
        `/arena/play/abande/${encodeURIComponent(id)}`,
        "?move=6&layout=live",
        target,
      ),
    ).to.equal(true);
  });
});

describe("arenaListTableHref", () => {
  const row = {
    tableId: "tid",
    metaGame: "abande",
    seatUserIds: ["u1", "u2"],
  };

  it("sends seated players to play during live games", () => {
    expect(
      arenaListTableHref({ ...row, state: "playing" }, "u1", {
        layout: "live",
      })
    ).to.equal(arenaPlayPath("abande", "tid", { layout: "live" }));
  });

  it("sends spectators to watch during live games", () => {
    expect(arenaListTableHref({ ...row, state: "playing" }, "u3")).to.equal(
      arenaWatchPath("abande", "tid")
    );
  });

  it("sends everyone to table lobby before launch", () => {
    expect(arenaListTableHref({ ...row, state: "seated" }, "u1")).to.equal(
      arenaTablePath("abande", "tid")
    );
  });
});
