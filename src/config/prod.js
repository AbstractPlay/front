const API_ENDPOINT =
  "https://7n1lziet28.execute-api.us-east-1.amazonaws.com/prod/";

module.exports = {
  COGNITO_USER_POOL_ID: "us-east-1_YCjgSZHJm",
  COGNITO_DOMAIN: "abstractplaylogin.auth.us-east-1.amazoncognito.com",
  COGNITO_APPID: "2isan3ctk1aabt2v6r6aptlpg",
  COGNITO_COOKIE_DOMAIN: "play.abstractplay.com",
  COGNITO_REDIRECT_LOGIN: "https://play.abstractplay.com",
  COGNITO_REDIRECT_LOGOUT: "https://play.abstractplay.com",
  API_ENDPOINT_OPEN: API_ENDPOINT + "query",
  API_ENDPOINT_AUTH: API_ENDPOINT + "authQuery",
  PUSH_API_URL: API_ENDPOINT + "authQuery",
};
