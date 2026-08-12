import merge from "lodash/merge";
import { REAL_MODE } from "../lib/realMode";
import globalConfig from "./global";
import local from "./local";
import dev from "./dev";
import prod from "./prod";

let env;
if (REAL_MODE === "local") {
  env = local;
} else if (REAL_MODE === "development") {
  env = dev;
} else {
  env = prod;
}

const config = merge({}, globalConfig, env);

export const {
  PUSH_VAPID_PUBLIC_KEY,
  COGNITO_USER_POOL_ID,
  COGNITO_DOMAIN,
  COGNITO_APPID,
  COGNITO_COOKIE_DOMAIN,
  COGNITO_REDIRECT_LOGIN,
  COGNITO_REDIRECT_LOGOUT,
  API_ENDPOINT_OPEN,
  API_ENDPOINT_AUTH,
  PUSH_API_URL,
  API_ENDPOINT,
  WS_ENDPOINT,
} = config;

export default config;
