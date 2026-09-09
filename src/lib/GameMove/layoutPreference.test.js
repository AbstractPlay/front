import { expect } from "chai";
import {
  ALL_LAYOUTS,
  DEFAULT_LAYOUT,
  LAYOUT_CARD,
  LAYOUT_CLASSIC,
  LAYOUT_NARRATIVE,
  LAYOUT_STRIP,
  STORAGE_BETA_LAYOUT,
  STORAGE_LAYOUT,
  STORAGE_LAYOUT_HINT_DISMISSED,
  dismissLayoutHint,
  gameMovePath,
  readLayoutPreference,
  resolveGameMoveLayout,
  shouldShowLayoutHint,
  writeLayoutPreference,
} from "./layoutPreference.js";

describe("layoutPreference", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_LAYOUT);
    localStorage.removeItem(STORAGE_BETA_LAYOUT);
    localStorage.removeItem(STORAGE_LAYOUT_HINT_DISMISSED);
  });

  it("builds move paths with optional layout query", () => {
    expect(gameMovePath("amazons", 0, "abc123")).to.equal(
      "/move/amazons/0/abc123"
    );
    expect(
      gameMovePath("amazons", 0, "abc123", { layout: LAYOUT_CARD })
    ).to.equal("/move/amazons/0/abc123?layout=card");
    expect(
      gameMovePath("amazons", 0, "abc123", { layout: LAYOUT_CLASSIC })
    ).to.equal("/move/amazons/0/abc123?layout=classic");
  });

  it("resolves layout from query string, localStorage, then default", () => {
    expect(resolveGameMoveLayout("?layout=unknown")).to.deep.equal({
      layoutId: DEFAULT_LAYOUT,
      resolvedFrom: "default",
    });
    expect(resolveGameMoveLayout("")).to.deep.equal({
      layoutId: DEFAULT_LAYOUT,
      resolvedFrom: "default",
    });

    expect(resolveGameMoveLayout("?layout=card")).to.deep.equal({
      layoutId: LAYOUT_CARD,
      resolvedFrom: "url",
    });
    expect(resolveGameMoveLayout("?layout=narrative")).to.deep.equal({
      layoutId: LAYOUT_NARRATIVE,
      resolvedFrom: "url",
    });

    writeLayoutPreference(LAYOUT_CLASSIC);
    expect(resolveGameMoveLayout("")).to.deep.equal({
      layoutId: LAYOUT_CLASSIC,
      resolvedFrom: "localStorage",
    });
  });

  it("migrates legacy queue layout to card", () => {
    localStorage.setItem(STORAGE_BETA_LAYOUT, "queue");
    expect(readLayoutPreference()).to.equal(LAYOUT_CARD);
    expect(resolveGameMoveLayout("?layout=queue")).to.deep.equal({
      layoutId: LAYOUT_CARD,
      resolvedFrom: "url",
    });
  });

  it("defaults to strip layout", () => {
    expect(DEFAULT_LAYOUT).to.equal(LAYOUT_STRIP);
    expect(ALL_LAYOUTS).to.include(LAYOUT_CLASSIC);
  });

  it("shows layout hint only for first-time default strip", () => {
    expect(shouldShowLayoutHint("default")).to.be.true;
    expect(shouldShowLayoutHint("url")).to.be.false;
    writeLayoutPreference(LAYOUT_STRIP);
    expect(shouldShowLayoutHint("default")).to.be.false;
    localStorage.removeItem(STORAGE_LAYOUT);
    dismissLayoutHint();
    expect(shouldShowLayoutHint("default")).to.be.false;
  });
});
