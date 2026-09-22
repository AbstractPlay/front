import { describe, expect, it } from "vitest";
import {
  getLatestOpponentChatTimestamp,
  getLatestUserChatTimestamp,
  isUserChatComment,
} from "./userChatComments";

describe("userChatComments", () => {
  it("treats empty userId as system", () => {
    expect(
      isUserChatComment({
        userId: "",
        comment: "pie",
        timeStamp: 1,
      })
    ).toBe(false);
  });

  it("ignores system flag", () => {
    expect(
      isUserChatComment({
        userId: "u1",
        system: true,
        timeStamp: 1,
      })
    ).toBe(false);
  });

  it("latest timestamp skips system lines", () => {
    expect(
      getLatestUserChatTimestamp([
        { userId: "", timeStamp: 5000 },
        { userId: "u1", timeStamp: 1000 },
      ])
    ).toBe(1000);
  });

  it("opponent latest skips self and system", () => {
    expect(
      getLatestOpponentChatTimestamp(
        [
          { userId: "", timeStamp: 9000 },
          { userId: "me", timeStamp: 5000 },
          { userId: "u1", timeStamp: 2000 },
          { userId: "u2", timeStamp: 3000 },
        ],
        "me",
      ),
    ).toBe(3000);
  });
});
