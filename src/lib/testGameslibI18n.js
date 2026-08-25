import i18n from "i18next";
import { addResource } from "@abstractplay/gameslib";
import enApgames from "../../node_modules/@abstractplay/gameslib/locales/en/apgames.json";

let ready;

/** Load gameslib variant labels without gitignored src/locales bundles. */
export function setupGameslibI18nForTests() {
  if (!ready) {
    ready = i18n
      .init({
        lng: "en",
        ns: ["apgames"],
        resources: { en: { apgames: enApgames } },
      })
      .then(() => {
        addResource("en", i18n);
      });
  }
  return ready;
}
