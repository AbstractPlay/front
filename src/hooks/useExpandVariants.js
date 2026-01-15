
import { useState, useEffect, useCallback } from 'react';
import { GameFactory, gameinfo } from '@abstractplay/gameslib';

export function useExpandVariants(metaGame) {
  const [variantMap, setVariantMap] = useState(new Map());
  const [variantGroups, setVariantGroups] = useState(new Set());
  const [varId2Group, setVarId2Group] = useState(new Map());

  useEffect(() => {
    const info = gameinfo.get(metaGame);
    let gameEngine;
    if (info.playercounts.length > 1) {
      gameEngine = GameFactory(info.uid, 2);
    } else {
      gameEngine = GameFactory(info.uid);
    }
    const all = gameEngine.allvariants();
    if (all !== undefined) {
      setVariantMap(new Map(
        all.map((rec) => [rec.uid, rec.name])
      ));
      setVariantGroups(new Set(
        all.map((rec) => rec.group).filter(Boolean)
      ));
      setVarId2Group(new Map(
        all.map((rec) => [rec.uid, rec.group])
      ));
    } else {
      setVariantMap(new Map());
      setVariantGroups(new Set());
      setVarId2Group(new Map());
    }
  }, [metaGame]);

  const expandVariants = useCallback((vars) => {
    // if the string is empty, return all the group defaults
    if (vars.length === 0) {
      return [...variantMap.entries()]
        .filter(([k]) => k.startsWith("#"))
        .map(([, v]) => v)
        .filter(Boolean);
    }
    // otherwise add any missing defaults and just look up the rest
    else {
        const groups = new Set([...variantGroups]);
        for (const v of vars) {
            const g = varId2Group.get(v);
            if (g !== undefined) {
                groups.delete(g);
            }
        }
        // if any groups are not defined, add the defaults to vars
        for (const g of groups) {
            vars.push(`#${g}`);
        }
        return vars.map((v) => variantMap.get(v)).filter(Boolean);
    }
  }, [variantMap, variantGroups, varId2Group]);

  return { expandVariants };
}

