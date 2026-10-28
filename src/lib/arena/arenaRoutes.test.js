import { expect } from "chai";
import {
  arenaListTableHref,
  arenaPlayPath,
  arenaTablePath,
  arenaWatchPath,
} from "./arenaRoutes.js";

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
