import { useEffect } from "react";
import { useStore } from "../stores";
import { resolveAuthSession, refreshAuthSession } from "../lib/authSession";

export function useAuthSession() {
  const authSession = useStore((state) => state.authSession);

  useEffect(() => {
    if (authSession.status === "unknown") {
      resolveAuthSession();
    }
  }, [authSession.status]);

  return {
    ...authSession,
    refresh: refreshAuthSession,
  };
}
