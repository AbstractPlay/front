const API_ENDPOINT =
  "https://alyhqu85me.execute-api.us-east-1.amazonaws.com/dev/";
const WS_ENDPOINT = "wss://qwmw4fb0l6.execute-api.us-east-1.amazonaws.com/dev";

module.exports = {
  COGNITO_USER_POOL_ID: "us-east-1_2zrzbEjoU",
  COGNITO_DOMAIN: "auth.dev.abstractplay.com", // "abstractplaydev.auth.us-east-1.amazoncognito.com",
  COGNITO_APPID: "14mpql1tmvntup4p2anm4jt782",
  COGNITO_COOKIE_DOMAIN: "play.dev.abstractplay.com",
  COGNITO_REDIRECT_LOGIN: "https://play.dev.abstractplay.com",
  COGNITO_REDIRECT_LOGOUT: "https://play.dev.abstractplay.com",
  API_ENDPOINT_OPEN: API_ENDPOINT + "query",
  API_ENDPOINT_AUTH: API_ENDPOINT + "authQuery",
  PUSH_API_URL: API_ENDPOINT + "authQuery",
  API_ENDPOINT,
  WS_ENDPOINT,
};
