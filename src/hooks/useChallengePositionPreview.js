import { useEffect, useState } from "react";
import { callAuthApi } from "../lib/api";
import { parseAuthResponse } from "../lib/parseAuthResponse";

/**
 * @param {{ id?: string, metaGame?: string, enabled?: boolean }} options
 */
export function useChallengePositionPreview({ id, metaGame, enabled = true }) {
  const [positionPreview, setPositionPreview] = useState(null);
  const [positionPreviewError, setPositionPreviewError] = useState(null);
  const [positionPreviewLoading, setPositionPreviewLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !id || !metaGame) {
      setPositionPreview(null);
      setPositionPreviewError(null);
      setPositionPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setPositionPreviewLoading(true);
    setPositionPreviewError(null);
    (async () => {
      try {
        const res = await callAuthApi(
          "get_challenge_position_preview",
          { id, metaGame },
          false
        );
        const parsed = await parseAuthResponse(res);
        if (!parsed.ok) {
          throw new Error(parsed.error);
        }
        if (!cancelled) {
          setPositionPreview(parsed.data);
        }
      } catch (err) {
        if (!cancelled) {
          setPositionPreviewError(err.message || String(err));
        }
      } finally {
        if (!cancelled) {
          setPositionPreviewLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, id, metaGame]);

  return {
    positionPreview,
    positionPreviewError,
    positionPreviewLoading,
  };
}
