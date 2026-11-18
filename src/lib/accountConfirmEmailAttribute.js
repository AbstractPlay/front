import { confirmUserAttribute } from "aws-amplify/auth";
import { refreshAuthSession } from "./authSession";
import { fetchProfile } from "./globalMeBootstrap";

/**
 * Confirm a pending Cognito `email` attribute update and refresh local session/profile.
 *
 * @param {string} code
 */
export async function confirmEmailAttributeCode(code) {
  await confirmUserAttribute({
    userAttributeKey: "email",
    confirmationCode: code,
  });
  await refreshAuthSession();
  await fetchProfile();
}