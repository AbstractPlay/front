/**
 * Resolve per-game custom CSS: account customization wins over localStorage.
 */

/**
 * @param {object | null | undefined} globalMe
 * @param {string | null | undefined} metaGame
 * @param {Record<string, { css?: string, active?: boolean }> | null | undefined} localStorageMap
 * @returns {{ css: string, active: boolean, source: 'account' | 'local' } | null}
 */
export function resolveEffectiveCustomCss(globalMe, metaGame, localStorageMap) {
  if (!metaGame) {
    return null;
  }

  const perGame = globalMe?.customizations?.[metaGame]?.customCss;
  if (perGame !== undefined) {
    return {
      css: perGame.css ?? "",
      active: perGame.active !== false,
      source: "account",
    };
  }

  const fromDefault = globalMe?.customizations?._default?.customCss;
  if (fromDefault !== undefined) {
    return {
      css: fromDefault.css ?? "",
      active: fromDefault.active !== false,
      source: "account",
    };
  }

  const local = localStorageMap?.[metaGame];
  if (local !== undefined) {
    return {
      css: local.css ?? "",
      active: local.active !== false,
      source: "local",
    };
  }

  return null;
}

/**
 * Whether legacy localStorage CSS should be imported into the Customize editor.
 */
export function shouldImportLegacyCustomCss(globalMe, metaGame, localEntry) {
  if (!metaGame || metaGame === "_default" || !localEntry) {
    return false;
  }
  if (globalMe?.customizations?.[metaGame]?.customCss !== undefined) {
    return false;
  }
  if (globalMe?.customizations?._default?.customCss !== undefined) {
    return false;
  }
  return true;
}
