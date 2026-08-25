const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @returns {{ instanceId: string, metaGame: string, variantUids: string[], legacy: boolean } | undefined} */
export function parseRecordGameId(gameid) {
  if (!gameid) {
    return undefined;
  }

  const colonIdx = gameid.indexOf(":");
  if (colonIdx !== -1) {
    const prefix = gameid.slice(0, colonIdx);
    const hashIdx = prefix.indexOf("#");
    if (hashIdx === -1) {
      return undefined;
    }
    const instanceId = prefix.slice(0, hashIdx);
    const metaGame = prefix.slice(hashIdx + 1);
    if (!UUID_RE.test(instanceId) || metaGame.length === 0) {
      return undefined;
    }
    const variantPart = gameid.slice(colonIdx + 1);
    const variantUids =
      variantPart.length === 0
        ? []
        : variantPart.split("|").filter((v) => v.length > 0);
    return {
      instanceId,
      metaGame,
      variantUids: [...variantUids].sort(),
      legacy: false,
    };
  }

  const hashIdx = gameid.indexOf("#");
  if (hashIdx === -1) {
    return undefined;
  }
  const metaGame = gameid.slice(0, hashIdx);
  const instanceId = gameid.slice(hashIdx + 1);
  if (metaGame.length === 0 || !UUID_RE.test(instanceId)) {
    return undefined;
  }
  return {
    instanceId,
    metaGame,
    variantUids: [],
    legacy: true,
  };
}
