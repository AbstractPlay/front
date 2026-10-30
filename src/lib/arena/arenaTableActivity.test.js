import { describe, expect, it } from "vitest";
import {
  diffArenaTableSeatActivity,
  snapshotArenaTableSeats,
} from "./arenaTableActivity.js";

describe("arenaTableActivity", () => {
  const table = (seats, state = "open") => ({
    tableId: "t1",
    metaGame: "abande",
    state,
    seats: seats.map((s, seatIndex) => ({ seatIndex, ...s })),
  });

  it("snapshots seat user ids and ready flags", () => {
    expect(
      snapshotArenaTableSeats(
        table([
          { userId: "host", ready: false },
          { userId: "", ready: false },
        ]),
      ),
    ).toEqual({
      tableId: "t1",
      metaGame: "abande",
      state: "open",
      seats: [
        { userId: "host", ready: false },
        { userId: "", ready: false },
      ],
    });
  });

  it("detects opponent join, leave, and ready", () => {
    const prev = snapshotArenaTableSeats(
      table([
        { userId: "me", ready: false },
        { userId: "", ready: false },
      ]),
    );
    const joined = snapshotArenaTableSeats(
      table([
        { userId: "me", ready: false },
        { userId: "them", ready: false },
      ]),
    );
    expect(diffArenaTableSeatActivity(prev, joined, "me")).toEqual([
      { type: "join", userId: "them", seatIndex: 1 },
    ]);

    const ready = snapshotArenaTableSeats(
      table([
        { userId: "me", ready: false },
        { userId: "them", ready: true },
      ]),
    );
    expect(diffArenaTableSeatActivity(joined, ready, "me")).toEqual([
      { type: "ready", userId: "them", seatIndex: 1 },
    ]);

    const left = snapshotArenaTableSeats(
      table([
        { userId: "me", ready: false },
        { userId: "", ready: false },
      ]),
    );
    expect(diffArenaTableSeatActivity(ready, left, "me")).toEqual([
      { type: "leave", userId: "them", seatIndex: 1 },
    ]);
  });

  it("ignores self actions and playing state", () => {
    const prev = snapshotArenaTableSeats(
      table([
        { userId: "me", ready: false },
        { userId: "", ready: false },
      ]),
    );
    const selfReady = snapshotArenaTableSeats(
      table([
        { userId: "me", ready: true },
        { userId: "", ready: false },
      ]),
    );
    expect(diffArenaTableSeatActivity(prev, selfReady, "me")).toEqual([]);

    const playing = snapshotArenaTableSeats(
      table(
        [
          { userId: "me", ready: true },
          { userId: "them", ready: true },
        ],
        "playing",
      ),
    );
    expect(diffArenaTableSeatActivity(prev, playing, "me")).toEqual([]);
  });
});
