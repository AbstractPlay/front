import { countryCodeList } from "./countryCodeList";

function isoToCountryCode(isoCode, keyToGet = "alpha2") {
  if (isoCode !== undefined) {
    const entry = countryCodeList.find(
      (countryObj) =>
        countryObj.alpha2 === isoCode ||
        countryObj.alpha3 === isoCode ||
        countryObj.numeric === isoCode
    );
    if (entry !== undefined && entry[keyToGet] !== undefined) {
      return entry[keyToGet];
    } else {
      return undefined;
    }
  }
  return undefined;
}

export { isoToCountryCode };
