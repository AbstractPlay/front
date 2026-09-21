import { getConsoleCaptureSnapshot } from "./consoleCapture";
import {
  isFeedbackNewFormUrl,
  normalizeReportedPageUrl,
  parseGameHintsFromApUrl,
} from "./recentApUrls";

const PENDING_ERROR_KEY = "feedback-pending-error";

export function stashPendingError(error) {
  if (!error || typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(
      PENDING_ERROR_KEY,
      JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack,
      }),
    );
  } catch {
    // ignore quota errors
  }
}

export function consumePendingError() {
  if (typeof sessionStorage === "undefined") {
    return undefined;
  }
  const raw = sessionStorage.getItem(PENDING_ERROR_KEY);
  if (!raw) {
    return undefined;
  }
  sessionStorage.removeItem(PENDING_ERROR_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function captureBugContext(searchParams = new URLSearchParams(), options = {}) {
  const reportedPageUrl = typeof options.reportedPageUrl === "string"
    ? options.reportedPageUrl.trim()
    : "";
  const storedPageUrl = normalizeReportedPageUrl(reportedPageUrl) ?? "";
  const hintPageUrl = storedPageUrl
    || normalizeReportedPageUrl(searchParams.get("pageUrl") ?? "")
    || (typeof window !== "undefined"
      && !isFeedbackNewFormUrl(window.location.href)
      ? window.location.href
      : "");

  const context = {
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    consoleErrors: getConsoleCaptureSnapshot(),
  };
  if (storedPageUrl) {
    context.pageUrl = storedPageUrl;
  }

  const gameId = searchParams.get("gameId");
  const moveNumber = searchParams.get("moveNumber");
  const layoutId = searchParams.get("layoutId");
  if (gameId) {
    context.gameId = gameId;
  }
  if (moveNumber) {
    const parsed = Number(moveNumber);
    if (Number.isFinite(parsed)) {
      context.moveNumber = parsed;
    }
  }
  if (layoutId) {
    context.layoutId = layoutId;
  }

  const fromPage = parseGameHintsFromApUrl(hintPageUrl);
  if (fromPage.gameId && !context.gameId) {
    context.gameId = fromPage.gameId;
  }
  if (fromPage.moveNumber !== undefined && context.moveNumber === undefined) {
    context.moveNumber = fromPage.moveNumber;
  }
  if (fromPage.layoutId && !context.layoutId) {
    context.layoutId = fromPage.layoutId;
  }

  const pending = consumePendingError();
  if (pending) {
    context.capturedError = pending;
  }

  return context;
}
