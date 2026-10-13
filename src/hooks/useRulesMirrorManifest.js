import { useEffect, useState } from "react";
import { fetchRulesMirrorManifest } from "../lib/rulesMirror";

export function useRulesMirrorManifest() {
  const [manifest, setManifest] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchRulesMirrorManifest().then((data) => {
      if (!cancelled) {
        setManifest(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return manifest;
}
