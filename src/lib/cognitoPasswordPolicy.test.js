import { describe, expect, it } from "vitest";
import {
  evaluateCognitoPasswordPolicy,
  passwordMeetsCognitoPolicy,
} from "./cognitoPasswordPolicy";

describe("passwordMeetsCognitoPolicy", () => {
  it("accepts a policy-compliant password", () => {
    expect(passwordMeetsCognitoPolicy("Ab1!xxxx")).toBe(true);
  });

  it("rejects short passwords", () => {
    expect(passwordMeetsCognitoPolicy("Ab1!x")).toBe(false);
  });

  it("rejects missing symbol", () => {
    expect(passwordMeetsCognitoPolicy("Abcd1234")).toBe(false);
  });

  it("evaluateCognitoPasswordPolicy reports each rule", () => {
    const rules = evaluateCognitoPasswordPolicy("Ab1!");
    expect(rules.find((r) => r.id === "minLength")?.met).toBe(false);
    expect(rules.find((r) => r.id === "symbol")?.met).toBe(true);
    expect(passwordMeetsCognitoPolicy("Ab1!xxxx")).toBe(true);
  });
});