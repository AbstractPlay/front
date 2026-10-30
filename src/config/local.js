import dev from "./dev";
import prod from "./prod";

/** Flip to "prod" to hit production API/WS/Cognito from localhost. */
const LOCAL_BACKEND = "prod";

const backend = LOCAL_BACKEND === "prod" ? prod : dev;

const localConfig = {
  ...backend,
  COGNITO_COOKIE_DOMAIN: "localhost",
  COGNITO_REDIRECT_LOGIN: "http://localhost:3000",
  COGNITO_REDIRECT_LOGOUT: "http://localhost:3000",
};

export default localConfig;
