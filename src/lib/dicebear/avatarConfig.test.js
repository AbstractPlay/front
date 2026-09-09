import { describe, expect, it } from "vitest";
import {
  avatarConfigsEqual,
  defaultAvatarConfig,
  isDefaultAvatarConfig,
  resolveAvatarConfig,
} from "./avatarConfig";

describe("avatarConfig", () => {
  it("defaults to identicon with user id", () => {
    expect(resolveAvatarConfig({ id: "user-123" })).toEqual({
      style: "identicon",
      seed: "user-123",
    });
  });

  it("reads avatar from settings", () => {
    expect(
      resolveAvatarConfig({
        id: "user-123",
        settings: {
          all: {
            profile: {
              avatar: { style: "blobs", seed: "my-seed" },
            },
          },
        },
      })
    ).toEqual({ style: "blobs", seed: "my-seed" });
  });

  it("reads mirrored public avatar fields", () => {
    expect(
      resolveAvatarConfig({
        id: "user-123",
        avatarStyle: "glass",
        avatarSeed: "public-seed",
      })
    ).toEqual({ style: "glass", seed: "public-seed" });
  });

  it("prefers settings over mirror fields", () => {
    expect(
      resolveAvatarConfig({
        id: "user-123",
        avatarStyle: "glass",
        avatarSeed: "public-seed",
        settings: {
          all: {
            profile: {
              avatar: { style: "rings", seed: "private-seed" },
            },
          },
        },
      })
    ).toEqual({ style: "rings", seed: "private-seed" });
  });

  it("falls back when style or seed is invalid", () => {
    expect(
      resolveAvatarConfig({
        id: "user-123",
        settings: {
          all: {
            profile: {
              avatar: { style: "voxel-art", seed: "bad" },
            },
          },
        },
      })
    ).toEqual(defaultAvatarConfig("user-123"));
  });

  it("detects default avatar config", () => {
    expect(isDefaultAvatarConfig(defaultAvatarConfig("user-123"), "user-123")).toBe(
      true
    );
    expect(
      isDefaultAvatarConfig({ style: "blobs", seed: "user-123" }, "user-123")
    ).toBe(false);
  });

  it("compares avatar configs", () => {
    expect(
      avatarConfigsEqual(
        { style: "blobs", seed: "a" },
        { style: "blobs", seed: "a" }
      )
    ).toBe(true);
    expect(
      avatarConfigsEqual(
        { style: "blobs", seed: "a" },
        { style: "glass", seed: "a" }
      )
    ).toBe(false);
  });
});
