export const setGlyphMapOpt = ({options, metaGame, globalMe}) => {
    let glyphmap = [];
    if (globalMe?.customizations?.[metaGame]) {
        const custom = globalMe.customizations[metaGame];
        if (
            custom.glyphmap &&
            Array.isArray(custom.glyphmap) &&
            custom.glyphmap.length > 0
        ) {
            glyphmap = [...custom.glyphmap];
        }
    } else if (globalMe?.customizations?._default) {
        const custom = globalMe.customizations._default;
        if (
            custom.glyphmap &&
            Array.isArray(custom.glyphmap) &&
            custom.glyphmap.length > 0
        ) {
            glyphmap = [...custom.glyphmap];
        }
    }
    // set option
    if (glyphmap.length > 0) {
        options.glyphmap = [...glyphmap];
    }
}