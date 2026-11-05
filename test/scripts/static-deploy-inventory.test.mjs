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
import {
  LIST_OBJECTS_MAX_KEYS,
  LIST_OBJECTS_QUERY,
  buildListObjectsV2Args,
  objectsFromListPage,
  planPruneActions,
} from "../../scripts/prune-stale-static.mjs";

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

describe("buildListObjectsV2Args", () => {
  it("requests slim paginated listings", () => {
    const config = { bucket: "abstract-play-dev", profile: "AbstractPlayDev" };
    const args = buildListObjectsV2Args(config, "static/", "token-abc");
    assert.ok(args.includes("--query"));
    assert.ok(args.includes(LIST_OBJECTS_QUERY));
    assert.ok(args.includes("--max-keys"));
    assert.ok(args.includes(String(LIST_OBJECTS_MAX_KEYS)));
    assert.ok(args.includes("--continuation-token"));
    assert.ok(args.includes("token-abc"));
  });
});

describe("objectsFromListPage", () => {
  it("maps Key and LastModified from a list page", () => {
    const objects = objectsFromListPage({
      Contents: [{ Key: "static/js/a.js", LastModified: "2026-06-01T00:00:00.000Z" }],
    });
    assert.equal(objects.length, 1);
    assert.equal(objects[0].key, "static/js/a.js");
    assert.equal(objects[0].lastModifiedMs, Date.parse("2026-06-01T00:00:00.000Z"));
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
