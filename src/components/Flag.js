import React, {
  useState
} from "react";
import { isoToCountryCode } from "../lib/isoToCountryCode";

function Flag({
    code,
    size = 'l',
    gradient = '',
    hasBorder = true,
    hasDropShadow = false,
    hasBorderRadius = true,
    className
}) {
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
      setHasError(true);
    };

    if ( (code === undefined) || (code === null) || (code === "") ) {
        return null;
    }
    const countryName = isoToCountryCode(code, "countryName");
    const alpha2 = isoToCountryCode(code, "alpha2");
    return (
      <>
        {hasError ? null :
          <div
            className={
              `flag
            ${gradient}
            size-${size}
            ${hasBorder ? 'border' : ''}
            ${hasDropShadow ? 'drop-shadow' : ''}
            ${hasBorderRadius ? 'border-radius' : ''}
            ${className ? className.replace(/\s\s+/g, ' ').trim() : ''}`
            }
            title={countryName}
            >
            <img src={`/flags/${size}/${alpha2}.svg`} alt={`flag for ${countryName}`} onError={handleError}/>
          </div>
        }
      </>
    );
}

export default Flag;
