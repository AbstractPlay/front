/**
 * Vitest alias target for real gameslib engines (compiled build output).
 * Do not import @abstractplay/gameslib directly in tests without mocking.
 */
const path = require("path");

module.exports = require(path.resolve(
  __dirname,
  "../../node_modules/@abstractplay/gameslib/build/index.js"
));
