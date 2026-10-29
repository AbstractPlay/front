import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CACHE_IMMUTABLE,
  CACHE_SHELL,
  planStaticDeploySteps,
  shellHtmlComesLast,
} from "../../scripts/staticDeployCache.mjs";

describe("planStaticDeploySteps", () => {
  it("uploads hashed assets before shell HTML", () => {
    const steps = planStaticDeploySteps("/tmp/build");
    assert.ok(shellHtmlComesLast(steps));
    const cpSteps = steps.filter((s) => s.kind === "cp");
    assert.deepEqual(
      cpSteps.map((s) => s.file),
      ["error.html", "index.html"],
    );
    assert.equal(cpSteps[1].cacheControl, CACHE_SHELL);
  });

  it("uses immutable cache for static and flags syncs", () => {
    const steps = planStaticDeploySteps("/tmp/build");
    const staticStep = steps.find(
      (s) => s.kind === "sync" && s.localSubdir === "static",
    );
    assert.equal(staticStep.cacheControl, CACHE_IMMUTABLE);
    const rootStep = steps.find((s) => s.kind === "sync-root");
    assert.ok(rootStep.exclude.includes("index.html"));
    assert.ok(rootStep.exclude.includes("error.html"));
  });
});
