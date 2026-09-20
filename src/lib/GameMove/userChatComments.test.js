import { describe, expect, it } from "vitest";
import {
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
});
