/**
 * Jest-safe entry to real gameslib engines (compiled build output).
 * Use via jest.mock in tests that need real GameFactory — do not import
 * @abstractplay/gameslib directly in those files without the mock in place.
 */
const path = require("path");

module.exports = require(path.resolve(
  __dirname,
  "../../node_modules/@abstractplay/gameslib/build/index.js"
));
