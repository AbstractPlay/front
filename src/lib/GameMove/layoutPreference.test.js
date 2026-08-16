import { expect } from "chai";
import {
  DEFAULT_BETA_LAYOUT,
  LAYOUT_CARD,
  LAYOUT_NARRATIVE,
  LAYOUT_STRIP,
  STORAGE_BETA_LAYOUT,
  gameMovePath,
  isBetaGameMovePath,
  readBetaLayoutPreference,
  resolveBetaLayout,
} from "./layoutPreference.js";

describe("layoutPreference", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_BETA_LAYOUT);
  });

  it("builds classic and beta paths", () => {
    expect(gameMovePath("amazons", 0, "abc123")).to.equal(
      "/move/amazons/0/abc123"
    );
    expect(
      gameMovePath("amazons", 0, "abc123", { beta: true, layout: LAYOUT_CARD })
    ).to.equal("/move-beta/amazons/0/abc123?layout=card");
    expect(
      gameMovePath("amazons", 0, "abc123", {
        beta: true,
        layout: LAYOUT_NARRATIVE,
      })
    ).to.equal("/move-beta/amazons/0/abc123?layout=narrative");
  });

  it("detects beta routes", () => {
    expect(isBetaGameMovePath("/move-beta/amazons/0/abc123")).to.be.true;
    expect(isBetaGameMovePath("/move/amazons/0/abc123")).to.be.false;
  });

  it("resolves layout from query string and falls back to default", () => {
    expect(resolveBetaLayout("?layout=card")).to.equal(LAYOUT_CARD);
    expect(resolveBetaLayout("?layout=narrative")).to.equal(LAYOUT_NARRATIVE);
    expect(resolveBetaLayout("?layout=strip")).to.equal(LAYOUT_STRIP);
    expect(resolveBetaLayout("?layout=unknown")).to.equal(DEFAULT_BETA_LAYOUT);
    expect(resolveBetaLayout("")).to.equal(DEFAULT_BETA_LAYOUT);
  });

  it("migrates legacy queue layout to card", () => {
    localStorage.setItem(STORAGE_BETA_LAYOUT, "queue");
    expect(readBetaLayoutPreference()).to.equal(LAYOUT_CARD);
    expect(resolveBetaLayout("?layout=queue")).to.equal(LAYOUT_CARD);
  });

  it("defaults to strip layout", () => {
    expect(DEFAULT_BETA_LAYOUT).to.equal(LAYOUT_STRIP);
  });
});
