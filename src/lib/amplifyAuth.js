import { Amplify } from "aws-amplify";
import { signInWithRedirect } from "aws-amplify/auth";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { CookieStorage } from "aws-amplify/utils";
import {
  COGNITO_APPID,
  COGNITO_COOKIE_DOMAIN,
  COGNITO_DOMAIN,
  COGNITO_REDIRECT_LOGIN,
  COGNITO_REDIRECT_LOGOUT,
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
          oauth: {
            domain: COGNITO_DOMAIN,
            scopes: ["openid", "email", "aws.cognito.signin.user.admin"],
            redirectSignIn: [COGNITO_REDIRECT_LOGIN],
            redirectSignOut: [COGNITO_REDIRECT_LOGOUT],
            responseType: "code",
          },
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

export function redirectToSignIn() {
  return signInWithRedirect();
}
