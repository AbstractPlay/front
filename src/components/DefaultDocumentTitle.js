import { useLocation } from "react-router-dom";
import PageHelmet from "./PageHelmet";
import { getDefaultDocumentTitle } from "../lib/siteDocumentTitle";

/**
 * Resets document.title on every route change. Route components with their own
 * PageHelmet override this while mounted.
 */
export default function DefaultDocumentTitle() {
  const { pathname } = useLocation();

  return (
    <PageHelmet key={pathname} title={getDefaultDocumentTitle()} />
  );
}
