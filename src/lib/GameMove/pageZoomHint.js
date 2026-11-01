const STORAGE_PAGE_ZOOM_BOARD_HINT_DISMISSED = "play-page-zoom-board-hint-dismissed";

function readDismissed() {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(STORAGE_PAGE_ZOOM_BOARD_HINT_DISMISSED) === "1";
  } catch {
    return false;
  }
}

export function isPageZoomBoardHintDismissed() {
  return readDismissed();
}

export function dismissPageZoomBoardHint() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_PAGE_ZOOM_BOARD_HINT_DISMISSED, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {{ pageZoomActive: boolean, boardZoomAvailable: boolean, gameReady: boolean }} opts
 */
export function shouldShowPageZoomBoardHint({
  pageZoomActive,
  boardZoomAvailable,
  gameReady,
}) {
  if (!pageZoomActive || !boardZoomAvailable || !gameReady) {
    return false;
  }
  return !readDismissed();
}
