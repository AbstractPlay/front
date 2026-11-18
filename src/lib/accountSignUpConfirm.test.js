import { beforeEach, describe, expect, it, vi } from "vitest";

const confirmSignUp = vi.fn();
const autoSignIn = vi.fn();

vi.mock("aws-amplify/auth", () => ({
  confirmSignUp: (...args) => confirmSignUp(...args),
  autoSignIn: (...args) => autoSignIn(...args),
}));

import { completeSignUpConfirmation } from "./accountSignUpConfirm";

describe("completeSignUpConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls autoSignIn when Cognito requests it", async () => {
    confirmSignUp.mockResolvedValue({
      isSignUpComplete: true,
      nextStep: { signUpStep: "COMPLETE_AUTO_SIGN_IN" },
    });
    autoSignIn.mockResolvedValue({});

    await completeSignUpConfirmation({ username: "ada", code: "123456" });

    expect(confirmSignUp).toHaveBeenCalledWith({
      username: "ada",
      confirmationCode: "123456",
    });
    expect(autoSignIn).toHaveBeenCalledTimes(1);
  });

  it("skips autoSignIn when not offered", async () => {
    confirmSignUp.mockResolvedValue({
      isSignUpComplete: true,
      nextStep: { signUpStep: "DONE" },
    });

    await completeSignUpConfirmation({ username: "ada", code: "123456" });

    expect(autoSignIn).not.toHaveBeenCalled();
  });
});