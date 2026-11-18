import { describe, expect, it } from "vitest";
import {
  shouldOpenUserSettingsProfile,
  userSettingsProfileReturnPath,
} from "./userSettingsDeepLink";

describe("userSettingsDeepLink", () => {
  it("builds profile settings return path", () => {
    expect(userSettingsProfileReturnPath()).toBe("/?userSettings=profile");
  });

  it("detects profile settings query flag", () => {
    expect(shouldOpenUserSettingsProfile("?userSettings=profile")).toBe(true);
    expect(shouldOpenUserSettingsProfile("?userSettings=notifications")).toBe(
      false,
    );
  });
});