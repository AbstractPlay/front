import { autoSignIn, confirmSignUp } from "aws-amplify/auth";

/**
 * Confirm sign-up from email link or manual code; completes auto sign-in when enabled at signUp.
 *
 * @param {{ username: string, code: string }} params
 */
export async function completeSignUpConfirmation({ username, code }) {
  const result = await confirmSignUp({
    username,
    confirmationCode: code,
  });
  if (
    result.isSignUpComplete
    && result.nextStep?.signUpStep === "COMPLETE_AUTO_SIGN_IN"
  ) {
    await autoSignIn();
  }
  return result;
}