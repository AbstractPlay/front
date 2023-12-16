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
    if ( (code === undefined) || (code === null) || (code === "") ) {
        return null;
    }
    const countryName = isoToCountryCode(code, "countryName");
    return (
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
        <img src={`/flags/${size}/${code}.svg`} alt={`flag for ${countryName}`} />
      </div>
    );
}

export default Flag;
