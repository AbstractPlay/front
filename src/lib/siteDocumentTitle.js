import { REAL_MODE } from "./realMode";

export const SITE_OG_TITLE = "Abstract Play: Make Time for Games";

export function getDefaultDocumentTitle() {
  if (REAL_MODE === "production") {
    return SITE_OG_TITLE;
  }
  return `${SITE_OG_TITLE} (Dev)`;
}
