const API_ENDPOINT =
  "https://alyhqu85me.execute-api.us-east-1.amazonaws.com/dev/";

module.exports = {
  COGNITO_USER_POOL_ID: "us-east-1_2zrzbEjoU",
  COGNITO_DOMAIN: "auth.dev.abstractplay.com", // "abstractplaydev.auth.us-east-1.amazoncognito.com",
  COGNITO_APPID: "14mpql1tmvntup4p2anm4jt782",
  COGNITO_COOKIE_DOMAIN: "localhost",
  COGNITO_REDIRECT_LOGIN: "http://localhost:3000",
  COGNITO_REDIRECT_LOGOUT: "http://localhost:3000",
  API_ENDPOINT_OPEN: API_ENDPOINT + "query",
  API_ENDPOINT_AUTH: API_ENDPOINT + "authQuery",
  PUSH_API_URL: API_ENDPOINT + "authQuery",
};

// const API_ENDPOINT =
//   "https://7n1lziet28.execute-api.us-east-1.amazonaws.com/prod/";

// module.exports = {
//   COGNITO_USER_POOL_ID: "us-east-1_YCjgSZHJm",
//   COGNITO_DOMAIN: "auth.abstractplay.com", // "abstractplaylogin.auth.us-east-1.amazoncognito.com",
//   COGNITO_APPID: "2isan3ctk1aabt2v6r6aptlpg",
//   COGNITO_COOKIE_DOMAIN: "localhost",
//   COGNITO_REDIRECT_LOGIN: "http://localhost:3000",
//   COGNITO_REDIRECT_LOGOUT: "http://localhost:3000",
//   API_ENDPOINT_OPEN: API_ENDPOINT + "query",
//   API_ENDPOINT_AUTH: API_ENDPOINT + "authQuery",
//   PUSH_API_URL: API_ENDPOINT + "authQuery",
// };
