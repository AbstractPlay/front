import { describe, expect, it } from "vitest";
import { orderVariantUidsForDisplay } from "./expandVariants";
import {
  botSupportedEntryKey,
  findBotSupportedDuplicateIndex,
  normalizeBotSupportedEntries,
} from "./botSupportedGames";

describe("normalizeBotSupportedEntries", () => {
  it("drops invalid rows and canonicalizes variant order", () => {
    const entries = normalizeBotSupportedEntries([
      { meta: "chess", variants: [] },
      { meta: "", variants: [] },
      null,
      { meta: "asli", variants: ["area", "woven"] },
    ]);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ meta: "chess", variants: [] });
    expect(entries[1].meta).toBe("asli");
    expect(entries[1].variants).toEqual(
      orderVariantUidsForDisplay("asli", ["area", "woven"], 2)
    );
  });
});

describe("botSupportedEntryKey", () => {
  it("treats variant order as canonical", () => {
    const a = botSupportedEntryKey({
      meta: "asli",
      variants: ["woven", "area"],
    });
    const b = botSupportedEntryKey({
      meta: "asli",
      variants: ["area", "woven"],
    });
    expect(a).toBe(b);
  });
});

describe("findBotSupportedDuplicateIndex", () => {
  it("finds matching meta and variants", () => {
    const list = [{ meta: "chess", variants: [] }];
    expect(findBotSupportedDuplicateIndex(list, "chess", [])).toBe(0);
    expect(findBotSupportedDuplicateIndex(list, "go", [])).toBe(-1);
  });
});
