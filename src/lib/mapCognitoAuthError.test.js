import { describe, expect, it } from "vitest";
import { mapCognitoAuthError } from "./mapCognitoAuthError";

describe("mapCognitoAuthError", () => {
  it("maps known Cognito codes to i18n keys", () => {
    expect(mapCognitoAuthError({ name: "UserNotFoundException" })).toBe(
      "CognitoError_UserNotFound",
    );
    expect(mapCognitoAuthError({ code: "CodeMismatchException" })).toBe(
      "CognitoError_CodeMismatch",
    );
  });

  it("falls back to generic", () => {
    expect(mapCognitoAuthError({ name: "SomethingElse" })).toBe(
      "CognitoError_Generic",
    );
    expect(mapCognitoAuthError(null)).toBe("CognitoError_Generic");
  });
});