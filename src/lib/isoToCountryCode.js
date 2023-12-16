import { countryCodeList } from './countryCodeList'

function isoToCountryCode(isoCode, keyToGet = "alpha2") {
  if (isoCode !== undefined) {
    // @ts-expect-error We handle an error here properly
    const alpha2Code = countryCodeList.find((countryObj) => (
      countryObj.alpha2 === isoCode
      || countryObj.alpha3 === isoCode
      || countryObj.numeric === isoCode
    ))[keyToGet]
    return alpha2Code
  }

  throw new Error('This code returns undefined, see https://www.flagpack.xyz/docs/flag-index for all the available codes.')
}

export { isoToCountryCode }
