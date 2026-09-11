import { describe, expect, it } from "vitest";
import { bggBbcodeToMarkdown } from "./bggBbcodeToMarkdown";

describe("bggBbcodeToMarkdown", () => {
  it("converts url and emphasis tags", () => {
    const input = "See [url=https://example.com/wiki]the wiki[/url] and [b]bold[/b] text.";
    expect(bggBbcodeToMarkdown(input)).toBe(
      "See [the wiki](https://example.com/wiki) and **bold** text.",
    );
  });

  it("converts family and thing links", () => {
    const input = "[family=81073]Abstract Play[/family] and [thing=2655]Hive[/thing]";
    expect(bggBbcodeToMarkdown(input)).toBe(
      "[Abstract Play](https://boardgamegeek.com/boardgamefamily/81073) and [Hive](https://boardgamegeek.com/boardgame/2655)",
    );
  });

  it("strips embedded image tags", () => {
    const input = "Before\n[imageid=9648600 medium]\nAfter";
    expect(bggBbcodeToMarkdown(input)).toBe("Before\n\nAfter");
  });
});
