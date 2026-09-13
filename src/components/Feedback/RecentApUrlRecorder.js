import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { recordApUrl } from "../../lib/feedback/recentApUrls";

/** Keeps a session list of AP pages visited for bug-report context. */
function RecentApUrlRecorder() {
  const location = useLocation();

  useEffect(() => {
    const url = `${window.location.origin}${location.pathname}${location.search}`;
    recordApUrl(url);
  }, [location.pathname, location.search]);

  return null;
}

export default RecentApUrlRecorder;
