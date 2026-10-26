import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_FILTER_CATEGORY_ORDER,
  availableNotificationFilters,
  notificationCategoryForBody,
  notificationCategoryForPanelRow,
} from "./notificationCategories";

describe("notificationCategoryForBody", () => {
  it("maps challenge types to challenges", () => {
    expect(notificationCategoryForBody({ type: "challengeIssued" })).toBe("challenges");
    expect(notificationCategoryForBody({ type: "challengeParticipantLeft" })).toBe(
      "challenges",
    );
  });

  it("maps bot types to bots", () => {
    expect(notificationCategoryForBody({ type: "botMoveFailed" })).toBe("bots");
    expect(notificationCategoryForBody({ type: "botOwnerPing" })).toBe("bots");
  });

  it("maps direct types to same-named categories", () => {
    expect(notificationCategoryForBody({ type: "gameEnd" })).toBe("gameEnd");
    expect(notificationCategoryForBody({ type: "feedbackNew" })).toBe("feedbackNew");
  });

  it("maps ladderPointsChange to gain or loss pref from delta sign", () => {
    expect(
      notificationCategoryForBody({ type: "ladderPointsChange", delta: 12 }),
    ).toBe("ladderPointsGain");
    expect(
      notificationCategoryForBody({ type: "ladderPointsChange", delta: -8 }),
    ).toBe("ladderPointsLoss");
    expect(
      notificationCategoryForBody({ type: "ladderPointsChange", delta: 0 }),
    ).toBe("ladderPointsGain");
  });

  it("returns null for unknown types", () => {
    expect(notificationCategoryForBody({ type: "unknownType" })).toBe(null);
    expect(notificationCategoryForBody({})).toBe(null);
  });
});

describe("notificationCategoryForPanelRow", () => {
  it("maps announcement rows", () => {
    expect(notificationCategoryForPanelRow({ kind: "announcement" })).toBe(
      "announcements",
    );
    expect(notificationCategoryForPanelRow({ kind: "announcement-more" })).toBe(
      "announcements",
    );
  });

  it("maps dashboard rows via body", () => {
    expect(
      notificationCategoryForPanelRow({
        kind: "dashboard",
        notification: { body: { type: "ratingChange" } },
      }),
    ).toBe("ratingChange");
  });
});

describe("availableNotificationFilters", () => {
  it("returns categories in stable order with count > 0 only", () => {
    const rows = [
      { kind: "dashboard", notification: { body: { type: "gameEnd" } } },
      { kind: "dashboard", notification: { body: { type: "challengeIssued" } } },
      { kind: "announcement" },
    ];
    const available = availableNotificationFilters(rows);
    expect(available).toEqual(["announcements", "challenges", "gameEnd"]);
    const orderIndices = available.map((k) =>
      NOTIFICATION_FILTER_CATEGORY_ORDER.indexOf(k),
    );
    expect(orderIndices.every((i, idx) => idx === 0 || i > orderIndices[idx - 1])).toBe(
      true,
    );
  });
});
