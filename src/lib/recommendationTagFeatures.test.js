import { describe, expect, it } from "vitest";
import {
  ELEVATED_MECHANIC_PREFIXES,
  IGNORED_MECHANIC_PREFIXES,
  MECHANIC_WEIGHT_DEFAULT,
  MECHANIC_WEIGHT_ELEVATED,
  STANDARD_BOARD_FEATURE,
  TAG_WEIGHTS,
  expandTagPrefixes,
  gameRecommendationFeatures,
  mechanicTagWeight,
  topLevelGoalBucket,
  topLevelGoalTag,
  topLevelGoalTags,
} from "./recommendationTagFeatures";

describe("expandTagPrefixes", () => {
  it("expands hierarchical tags", () => {
    expect(expandTagPrefixes("goal>score>race")).toEqual([
      "goal",
      "goal>score",
      "goal>score>race",
    ]);
  });

  it("returns a single entry for flat tags", () => {
    expect(expandTagPrefixes("goal>connect")).toEqual(["goal", "goal>connect"]);
  });
});

describe("mechanicTagWeight", () => {
  it("ignores ubiquitous place, move, and capture mechanics", () => {
    for (const tag of IGNORED_MECHANIC_PREFIXES) {
      expect(mechanicTagWeight(tag)).toBeNull();
    }
    expect(mechanicTagWeight("mechanic>place>stack")).toBeNull();
    expect(mechanicTagWeight("mechanic>random>play")).not.toBeNull();
  });

  it("elevates distinctive mechanic families including random subtrees", () => {
    for (const prefix of ELEVATED_MECHANIC_PREFIXES) {
      expect(mechanicTagWeight(prefix)).toBe(MECHANIC_WEIGHT_ELEVATED);
    }
    expect(mechanicTagWeight("mechanic>random>setup")).toBe(
      MECHANIC_WEIGHT_ELEVATED
    );
    expect(mechanicTagWeight("mechanic>stack")).toBe(MECHANIC_WEIGHT_DEFAULT);
  });
});

describe("gameRecommendationFeatures", () => {
  it("includes goal and component tags at configured weights", () => {
    const features = gameRecommendationFeatures([
      "goal>connect",
      "mechanic>capture",
      "components>pyramids",
    ]);
    expect(features.get("goal>connect")).toBe(TAG_WEIGHTS.goal);
    expect(features.has("mechanic>capture")).toBe(false);
    expect(features.get("components>pyramids")).toBe(TAG_WEIGHTS.components);
  });

  it("applies default and elevated mechanic weights", () => {
    const features = gameRecommendationFeatures([
      "mechanic>stack",
      "mechanic>hidden",
      "mechanic>place",
    ]);
    expect(features.get("mechanic>stack")).toBe(MECHANIC_WEIGHT_DEFAULT);
    expect(features.get("mechanic>hidden")).toBe(MECHANIC_WEIGHT_ELEVATED);
    expect(features.has("mechanic>place")).toBe(false);
    expect(features.get("mechanic")).toBe(MECHANIC_WEIGHT_ELEVATED);
  });

  it("expands parent prefixes for hierarchical goal tags", () => {
    const features = gameRecommendationFeatures(["goal>score>race"]);
    expect(features.get("goal>score>race")).toBe(TAG_WEIGHTS.goal);
    expect(features.get("goal>score")).toBe(TAG_WEIGHTS.goal);
    expect(features.get("goal")).toBe(TAG_WEIGHTS.goal);
  });

  it("includes root board tags and excludes shape/connect subtrees", () => {
    const features = gameRecommendationFeatures([
      "board>dynamic",
      "board>shape>hex",
      "board>connect>rect",
    ]);
    expect(features.get("board>dynamic")).toBe(TAG_WEIGHTS.boardRoot);
    expect(features.has("board>shape>hex")).toBe(false);
    expect(features.has("board>connect>rect")).toBe(false);
  });

  it("adds standard-board synthetic feature when a shape tag is present", () => {
    const withShape = gameRecommendationFeatures(["board>shape>square"]);
    const withoutShape = gameRecommendationFeatures(["board>dynamic"]);
    expect(withShape.get(STANDARD_BOARD_FEATURE)).toBe(
      TAG_WEIGHTS.standardBoard
    );
    expect(withoutShape.has(STANDARD_BOARD_FEATURE)).toBe(false);
  });

  it("treats component specialty tags as moderate signals", () => {
    const features = gameRecommendationFeatures([
      "components>decktet",
      "components>pyramids",
    ]);
    expect(features.get("components>decktet")).toBe(TAG_WEIGHTS.components);
    expect(features.get("components>pyramids")).toBe(TAG_WEIGHTS.components);
    expect(TAG_WEIGHTS.components).toBeLessThan(MECHANIC_WEIGHT_DEFAULT);
    expect(TAG_WEIGHTS.components).toBeGreaterThan(TAG_WEIGHTS.boardRoot);
  });
});

describe("topLevelGoalBucket", () => {
  it("maps nested goal tags to the first segment bucket", () => {
    expect(topLevelGoalBucket("goal>score>race")).toBe("goal>score");
    expect(topLevelGoalBucket("goal>connect")).toBe("goal>connect");
  });

  it("returns null for non-goal tags", () => {
    expect(topLevelGoalBucket("mechanic>capture")).toBeNull();
  });
});

describe("topLevelGoalTags", () => {
  it("collects distinct top-level goal buckets", () => {
    expect(topLevelGoalTags(["goal>score>race", "mechanic>place"])).toEqual([
      "goal>score",
    ]);
    expect(topLevelGoalTags(["goal>connect", "goal>area"])).toEqual([
      "goal>area",
      "goal>connect",
    ]);
  });
});

describe("topLevelGoalTag", () => {
  it("returns the sole bucket when only one goal family is present", () => {
    expect(topLevelGoalTag(["goal>score>race", "mechanic>race"])).toBe(
      "goal>score"
    );
  });

  it("prefers the goal family with stronger feature weight when multiple exist", () => {
    expect(
      topLevelGoalTag(["goal>connect", "goal>connect>hex", "goal>area"])
    ).toBe("goal>connect");
  });

  it("returns null when no goal tags exist", () => {
    expect(topLevelGoalTag(["mechanic>capture", "board>dynamic"])).toBeNull();
  });
});
