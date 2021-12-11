const API_ENDPOINT = "https://m3y2udc717.execute-api.us-east-1.amazonaws.com/dev/";

module.exports = {
  COGNITO_APPID: "5tjvv8go4peaudg88oi5mrnn2v",
  COGNITO_COOKIE_DOMAIN: "localhost",
  COGNITO_REDIRECT_LOGIN: "http://localhost:3000",
  COGNITO_REDIRECT_LOGOUT: "http://localhost:3000",
  API_ENDPOINT_OPEN: API_ENDPOINT + "query",
  API_ENDPOINT_AUTH: API_ENDPOINT + "authQuery",
};
