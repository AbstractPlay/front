const merge = require("lodash/merge");
const global = require("./global");

var env; // let doesn't seem to work here
console.log(`Env: ${JSON.stringify(process.env)}`);
if (process.env.REACT_APP_REAL_MODE === "local") {
  console.log("Loading local environment");
  env = require("./local");
} else if (process.env.REACT_APP_REAL_MODE === "development") {
  console.log("Loading dev environment");
  env = require("./dev");
} else {
  console.log("Loading prod environment");
  env = require("./prod");
}

module.exports = merge(global, env);
