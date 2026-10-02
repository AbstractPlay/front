import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { backfillManagedLocaleStamps } from "../../bin/translate.mjs";

function collectLeaves(obj, prefix = "") {
  const leaves = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return leaves;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("_")) {
      continue;
    }
    const leafPath = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      leaves[leafPath] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(leaves, collectLeaves(value, leafPath));
    }
  }
  return leaves;
}

function countStampDrift(sourceLeaves, targetData, srcTracking) {
  const targetLeaves = collectLeaves(targetData);
  let drift = 0;
  for (const [leafPath, sourceValue] of Object.entries(sourceLeaves)) {
    const translated = targetLeaves[leafPath];
    if (!translated) {
      continue;
    }
    const entry = srcTracking[leafPath];
    if (!entry) {
      drift++;
      continue;
    }
    const src = typeof entry === "string" ? entry : entry.src;
    const out = typeof entry === "object" ? entry.out : undefined;
    if (src !== sourceValue || out !== translated) {
      drift++;
    }
  }
  return drift;
}

describe("locale-src backfill", () => {
  it("aligns locale-src src/out with English and managed locale strings", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ap-locale-src-"));
    const en = {
      lab: {
        pasteHelp: "Paste help for simultaneous games.",
      },
      GoNextVar: "Show next move variant. Keys: down arrow or 'i'.",
    };
    const deTarget = {
      lab: {
        pasteHelp: "Hilfe für gleichzeitige Spiele.",
      },
      GoNextVar: "Nächste Variante. Taste 'i'.",
    };
    const staleTracking = {
      "lab.pasteHelp": {
        src: "Old English without simultaneous games.",
        out: "Alte Übersetzung.",
      },
      GoNextVar: {
        src: "Show next move variant. Keys: down arrow or 'm'.",
        out: "Falsche Taste.",
      },
    };

    fs.mkdirSync(path.join(root, "public/locales/en"), { recursive: true });
    fs.mkdirSync(path.join(root, "public/locales/de"), { recursive: true });
    fs.mkdirSync(path.join(root, "locale-src/de"), { recursive: true });
    fs.writeFileSync(path.join(root, "public/locales/en/apfront.json"), `${JSON.stringify(en, null, 2)}\n`);
    fs.writeFileSync(path.join(root, "public/locales/de/apfront.json"), `${JSON.stringify(deTarget, null, 2)}\n`);
    fs.writeFileSync(
      path.join(root, "locale-src/de/apfront.json"),
      `${JSON.stringify(staleTracking, null, 2)}\n`,
    );

    const sourcePath = path.join(root, "public/locales/en/apfront.json");
    assert.equal(backfillManagedLocaleStamps(sourcePath), true);

    const sourceLeaves = collectLeaves(en);
    const tracking = JSON.parse(fs.readFileSync(path.join(root, "locale-src/de/apfront.json"), "utf8"));
    assert.equal(countStampDrift(sourceLeaves, deTarget, tracking), 0);
    assert.equal(tracking["lab.pasteHelp"].src, en.lab.pasteHelp);
    assert.equal(tracking["lab.pasteHelp"].out, deTarget.lab.pasteHelp);
    assert.equal(tracking.GoNextVar.src, en.GoNextVar);
    assert.equal(tracking.GoNextVar.out, deTarget.GoNextVar);
  });
});
