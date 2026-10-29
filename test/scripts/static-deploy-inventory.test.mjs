import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";
import {
  buildStaticInventoryDocument,
  collectBuildAssetKeys,
  shouldPruneStaticObject,
} from "../../scripts/staticDeployInventory.mjs";
import { planPruneActions } from "../../scripts/prune-stale-static.mjs";

describe("collectBuildAssetKeys", () => {
  it("lists static and flags keys with posix prefixes", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ap-build-"));
    fs.mkdirSync(path.join(root, "static", "js"), { recursive: true });
    fs.writeFileSync(path.join(root, "static", "js", "main-abc.js"), "x");
    fs.mkdirSync(path.join(root, "flags"), { recursive: true });
    fs.writeFileSync(path.join(root, "flags", "us.svg"), "<svg/>");
    const keys = collectBuildAssetKeys(root);
    assert.deepEqual(keys, ["flags/us.svg", "static/js/main-abc.js"]);
    fs.rmSync(root, { recursive: true, force: true });
  });
});

describe("shouldPruneStaticObject", () => {
  const now = Date.parse("2026-06-01T12:00:00.000Z");
  const active = new Set(["static/js/main-new.js"]);

  it("never prunes keys in the current inventory", () => {
    assert.equal(
      shouldPruneStaticObject({
        key: "static/js/main-new.js",
        lastModifiedMs: now - 86400000 * 30,
        activeKeys: active,
        nowMs: now,
        graceDays: 7,
      }),
      false,
    );
  });

  it("never prunes index or locales by prefix", () => {
    assert.equal(
      shouldPruneStaticObject({
        key: "index.html",
        lastModifiedMs: now - 86400000 * 400,
        activeKeys: active,
        nowMs: now,
      }),
      false,
    );
  });

  it("keeps recent orphans within grace window", () => {
    assert.equal(
      shouldPruneStaticObject({
        key: "static/js/main-old.js",
        lastModifiedMs: now - 86400000 * 3,
        activeKeys: active,
        nowMs: now,
        graceDays: 7,
      }),
      false,
    );
  });

  it("prunes old orphans not in inventory", () => {
    assert.equal(
      shouldPruneStaticObject({
        key: "static/js/main-old.js",
        lastModifiedMs: now - 86400000 * 10,
        activeKeys: active,
        nowMs: now,
        graceDays: 7,
      }),
      true,
    );
  });
});

describe("planPruneActions", () => {
  it("returns sorted delete list from inventory and object listing", () => {
    const inventory = buildStaticInventoryDocument(["static/js/a.js"]);
    const now = Date.parse("2026-06-01T12:00:00.000Z");
    const deletes = planPruneActions(
      inventory,
      [
        { key: "static/js/a.js", lastModifiedMs: now - 86400000 * 100 },
        { key: "static/js/b.js", lastModifiedMs: now - 86400000 * 100 },
        { key: "static/js/c.js", lastModifiedMs: now - 86400000 * 2 },
      ],
      now,
      7,
    );
    assert.deepEqual(deletes, ["static/js/b.js"]);
  });
});
