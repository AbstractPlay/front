import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuthSession } from "./useAuthSession";
import { fetchProfile } from "../lib/globalMeBootstrap";

export function useProfileBootstrap() {
  const { status } = useAuthSession();

  useEffect(() => {
    if (status === "ready") {
      fetchProfile();
    }
  }, [status]);
}

export function useRefreshDataListener() {
  const location = useLocation();

  useEffect(() => {
    const handler = () => {
      if (location.pathname !== "/") {
        fetchProfile();
      }
    };
    window.addEventListener("refresh-data", handler);
    return () => window.removeEventListener("refresh-data", handler);
  }, [location.pathname]);
}
