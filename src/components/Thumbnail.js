import React, { useEffect, useState } from "react";
import { useStorageState } from "react-use-storage-state";
import { useTranslation } from "react-i18next";
import { fetchThumbnailSource, THUMBNAIL_CDN_ORIGIN } from "../lib/thumbnailArtifact.js";

function Thumbnail({ meta, linkToSource = false }) {
  const [colorMode] = useStorageState("color-mode", "light");
  const [moveUrl, setMoveUrl] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!linkToSource) {
      setMoveUrl(null);
      return undefined;
    }
    let cancelled = false;
    fetchThumbnailSource(meta).then((source) => {
      if (!cancelled) {
        setMoveUrl(source?.moveUrl ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [meta, linkToSource]);

  const img = (
    <img
      src={`${THUMBNAIL_CDN_ORIGIN}/${meta}-${colorMode}.svg`}
      alt={`Thumbnail for ${meta}`}
      width="100%"
      height="auto"
    />
  );

  if (!linkToSource) {
    return img;
  }

  return (
    <div>
      {img}
      {moveUrl ? (
        <p className="mt-2">
          <a href={moveUrl}>{t("tables.viewSampleGame")}</a>
        </p>
      ) : null}
    </div>
  );
}

export default Thumbnail;
