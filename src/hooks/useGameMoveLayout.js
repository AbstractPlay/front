import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "../stores";
import {
  LAYOUT_CLASSIC,
  MOVE_BETA_BASE,
  MOVE_CLASSIC_BASE,
  dismissExperimentBanner,
  isBetaGameMovePath,
  isExperimentBannerDismissed,
  resolveBetaLayout,
} from "../lib/GameMove/layoutPreference";

export function useGameMoveLayout() {
  const { pathname, search } = useLocation();
  const globalMe = useStore((state) => state.globalMe);
  const isLoggedIn = Boolean(globalMe?.id);

  const isBeta = useMemo(() => isBetaGameMovePath(pathname), [pathname]);
  const moveBasePath = isBeta ? MOVE_BETA_BASE : MOVE_CLASSIC_BASE;
  const layoutId = isBeta ? resolveBetaLayout(search) : LAYOUT_CLASSIC;
  const showExperimentBanner =
    isLoggedIn && !isBeta && !isExperimentBannerDismissed();

  const dismissBanner = useCallback(() => {
    dismissExperimentBanner();
  }, []);

  return {
    isBeta,
    isLoggedIn,
    layoutId,
    moveBasePath,
    showExperimentBanner,
    dismissBanner,
  };
}
