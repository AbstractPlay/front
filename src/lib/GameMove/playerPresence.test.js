import { expect } from "chai";
import { shouldShowPlayerOnline } from "./playerPresence";

describe("shouldShowPlayerOnline", () => {
  const connections = { visibleUserIds: ["u1", "u2"] };

  it("is false when viewer is not signed in", () => {
    expect(shouldShowPlayerOnline(null, connections, "u1")).to.be.false;
  });

  it("is false without a player id", () => {
    expect(shouldShowPlayerOnline({ id: "me" }, connections, undefined)).to.be
      .false;
  });

  it("is true when player id is in visibleUserIds", () => {
    expect(shouldShowPlayerOnline({ id: "me" }, connections, "u1")).to.be.true;
  });

  it("is false when player id is not visible", () => {
    expect(shouldShowPlayerOnline({ id: "me" }, connections, "u9")).to.be
      .false;
  });
});
