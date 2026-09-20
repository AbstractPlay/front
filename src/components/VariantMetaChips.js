import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Subtle badges for variant metadata from gameslib (fans, unrated).
 */
export default function VariantMetaChips({ variant }) {
  const { t } = useTranslation();
  if (variant === undefined || variant === null) {
    return null;
  }

  const chips = [];

  if (variant.fans === true) {
    const badge = t("gameVariants.communityBadge");
    const title = t("gameVariants.communityTitle");
    chips.push(
      <span
        key="fans"
        className="tag is-light is-size-7 ml-1"
        title={title}
        aria-label={`${badge}. ${title}`}
      >
        {badge}
      </span>,
    );
  }

  if (variant.unrated === true) {
    const badge = t("gameVariants.unratedBadge");
    const title = t("gameVariants.unratedTitle");
    chips.push(
      <span
        key="unrated"
        className="tag is-warning is-light is-size-7 ml-1"
        title={title}
        aria-label={`${badge}. ${title}`}
      >
        {badge}
      </span>,
    );
  }

  if (chips.length === 0) {
    return null;
  }

  return <>{chips}</>;
}
