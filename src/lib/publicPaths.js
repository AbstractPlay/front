/** Routes that should remain usable without forcing Cognito re-login. */
export function isAnonymousFriendlyPath(pathname = window.location.pathname) {
  if (pathname === "/about" || pathname === "/legal") {
    return true;
  }
  if (pathname === "/playground" || pathname === "/lab") {
    return true;
  }
  if (pathname === "/games" || pathname.startsWith("/games/")) {
    return true;
  }
  if (pathname === "/explore" || pathname.startsWith("/explore/")) {
    return true;
  }
  if (pathname.startsWith("/move/") || pathname.startsWith("/move-beta/")) {
    return true;
  }
  return false;
}
