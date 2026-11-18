import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuthSession } from "../../hooks/useAuthSession";
import { useStore } from "../../stores";
import { fetchProfile } from "../../lib/globalMeBootstrap";
import NewProfile from "../NewProfile";

/**
 * After Cognito sign-in, prompt for DDB profile when the subscriber has no USER row yet.
 */
export default function AccountOnboardingGate() {
  const { status } = useAuthSession();
  const globalMe = useStore((state) => state.globalMe);
  const location = useLocation();
  const [showNewProfile, setShowNewProfile] = useState(false);

  useEffect(() => {
    if (status !== "ready") {
      setShowNewProfile(false);
      return;
    }
    if (location.pathname.startsWith("/account/login")
      || location.pathname.startsWith("/account/register")) {
      return;
    }
    let cancelled = false;
    (async () => {
      await fetchProfile();
      if (cancelled) {
        return;
      }
      const me = useStore.getState().globalMe;
      const needsProfile = !me || me.id === undefined;
      setShowNewProfile(needsProfile);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, globalMe?.id, location.pathname]);

  const handleClose = async (cnt) => {
    setShowNewProfile(false);
    if (cnt > 0) {
      await fetchProfile();
    }
  };

  return (
    <NewProfile show={showNewProfile} handleClose={handleClose} updateMe={true} />
  );
}