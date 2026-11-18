import { Amplify } from "aws-amplify";
import { redirectToSignIn as goToAccountLogin } from "./accountLoginNavigation";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { CookieStorage } from "aws-amplify/utils";
import {
  COGNITO_APPID,
  COGNITO_COOKIE_DOMAIN,
  COGNITO_USER_POOL_ID,
} from "../config";

let configured = false;

export function configureAmplifyAuth() {
  if (configured) {
    return;
  }
  configured = true;

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: COGNITO_USER_POOL_ID,
        userPoolClientId: COGNITO_APPID,
        loginWith: {
          username: true,
          email: false,
          phone: false,
        },
      },
    },
  });

  cognitoUserPoolsTokenProvider.setKeyValueStorage(
    new CookieStorage({
      domain: COGNITO_COOKIE_DOMAIN,
      path: "/",
      expires: 7,
      secure: true,
    })
  );
}

export function redirectToSignIn(returnUrl) {
  goToAccountLogin(returnUrl);
}
