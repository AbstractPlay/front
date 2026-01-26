import { GameFactory, gameinfo } from "@abstractplay/gameslib";

export function expandVariants(metaGame, vars) {
  const info = gameinfo.get(metaGame);
  let gameEngine;
  if (info.playercounts.length > 1) {
    gameEngine = GameFactory(info.uid, 2);
  } else {
    gameEngine = GameFactory(info.uid);
  }

  const all = gameEngine.allvariants();
  if (!all) return [];

  const variantMap = new Map(all.map((rec) => [rec.uid, rec.name]));
  const variantGroups = new Set(all.map((rec) => rec.group).filter(Boolean));
  const varId2Group = new Map(all.map((rec) => [rec.uid, rec.group]));

  // If vars is empty, return all defaults
  if (vars.length === 0) {
    return [...variantMap.entries()]
      .filter(([k]) => k.startsWith("#"))
      .map(([, v]) => v)
      .filter(Boolean);
  }

  // Otherwise, add missing defaults and look up the rest
  const groups = new Set([...variantGroups]);
  for (const v of vars) {
    const g = varId2Group.get(v);
    if (g !== undefined) {
      groups.delete(g);
    }
  }

  for (const g of groups) {
    vars.push(`#${g}`);
  }

  return vars.map((v) => variantMap.get(v)).filter(Boolean);
}
