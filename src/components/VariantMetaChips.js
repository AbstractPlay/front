import React from "react";
import { useTranslation } from "react-i18next";

export function variantShowsMetaChips(variant) {
  if (variant === undefined || variant === null) {
    return false;
  }
  return variant.fans === true || variant.unrated === true;
}

/**
 * Subtle badges for variant metadata from gameslib (fans, unrated).
 */
export default function VariantMetaChips({ variant, compact = false }) {
  const { t } = useTranslation();
  if (variant === undefined || variant === null) {
    return null;
  }

  const chips = [];
  const chipClassBase = compact
    ? "tag is-light is-size-7 ml-1 ap-variant-meta-chip"
    : "tag is-light is-size-7 ml-1";

  if (variant.fans === true) {
    const badge = t("gameVariants.communityBadge");
    const title = t("gameVariants.communityTitle");
    chips.push(
      <span
        key="fans"
        className={chipClassBase}
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
        className={`${chipClassBase} is-warning`}
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
