import { afterEach, describe, expect, it, vi } from "vitest";

describe("arenaUiDisabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false when env is unset", async () => {
    vi.stubEnv("VITE_ARENA_UI_DISABLED", undefined);
    const { arenaUiDisabled } = await import("./arenaUiDisabled.js");
    expect(arenaUiDisabled()).toBe(false);
  });

  it("is true when env is true or 1", async () => {
    vi.stubEnv("VITE_ARENA_UI_DISABLED", "true");
    vi.resetModules();
    let mod = await import("./arenaUiDisabled.js");
    expect(mod.arenaUiDisabled()).toBe(true);

    vi.stubEnv("VITE_ARENA_UI_DISABLED", "1");
    vi.resetModules();
    mod = await import("./arenaUiDisabled.js");
    expect(mod.arenaUiDisabled()).toBe(true);
  });

  it("is false for other truthy-looking values", async () => {
    vi.stubEnv("VITE_ARENA_UI_DISABLED", "yes");
    vi.resetModules();
    const { arenaUiDisabled } = await import("./arenaUiDisabled.js");
    expect(arenaUiDisabled()).toBe(false);
  });
});
