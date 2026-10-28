import { expect } from "chai";
import {
  ALL_LAYOUTS,
  DEFAULT_LAYOUT,
  DEFAULT_LIVE_LAYOUT,
  LAYOUT_CARD,
  LAYOUT_CLASSIC,
  LAYOUT_NARRATIVE,
  LAYOUT_STRIP,
  PLAY_CONTEXT_CORRESPONDENCE,
  PLAY_CONTEXT_LIVE,
  STORAGE_BETA_LAYOUT,
  STORAGE_LAYOUT,
  STORAGE_LAYOUT_LIVE,
  STORAGE_LAYOUT_HINT_DISMISSED,
  dismissLayoutHint,
  gameMovePath,
  inferPlayContextFromPathname,
  readLayoutPreference,
  resolveGameMoveLayout,
  shouldShowLayoutHint,
  writeLayoutPreference,
} from "./layoutPreference.js";

describe("layoutPreference", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_LAYOUT);
    localStorage.removeItem(STORAGE_LAYOUT_LIVE);
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

  it("keeps live and correspondence layout prefs separate", () => {
    writeLayoutPreference(LAYOUT_NARRATIVE, PLAY_CONTEXT_CORRESPONDENCE);
    writeLayoutPreference(LAYOUT_CLASSIC, PLAY_CONTEXT_LIVE);

    expect(readLayoutPreference(PLAY_CONTEXT_CORRESPONDENCE)).to.equal(
      LAYOUT_NARRATIVE
    );
    expect(readLayoutPreference(PLAY_CONTEXT_LIVE)).to.equal(LAYOUT_CLASSIC);

    expect(
      resolveGameMoveLayout("", { playContext: PLAY_CONTEXT_LIVE })
    ).to.deep.equal({
      layoutId: LAYOUT_CLASSIC,
      resolvedFrom: "localStorage",
    });
    expect(
      resolveGameMoveLayout("", { playContext: PLAY_CONTEXT_CORRESPONDENCE })
    ).to.deep.equal({
      layoutId: LAYOUT_NARRATIVE,
      resolvedFrom: "localStorage",
    });
  });

  it("defaults live context to DEFAULT_LIVE_LAYOUT when unset", () => {
    expect(
      resolveGameMoveLayout("", { playContext: PLAY_CONTEXT_LIVE })
    ).to.deep.equal({
      layoutId: DEFAULT_LIVE_LAYOUT,
      resolvedFrom: "default",
    });
  });

  it("infers live play context from arena routes", () => {
    expect(inferPlayContextFromPathname("/arena/play/hex/abc")).to.equal(
      PLAY_CONTEXT_LIVE
    );
    expect(inferPlayContextFromPathname("/move/hex/0/abc")).to.equal(
      PLAY_CONTEXT_CORRESPONDENCE
    );
  });

  it("builds arena play paths with layout query", () => {
    expect(
      gameMovePath("hex", 0, "tid", {
        layout: LAYOUT_STRIP,
        basePath: "/arena/play",
      })
    ).to.equal("/arena/play/hex/0/tid?layout=strip");
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
