import React from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet-async";
import { canonicalPlayUrl } from "../lib/seoCanonical";

/**
 * Sets document.title and og:title from the same string so tab labels match
 * social preview titles. Optional canonicalPath or canonical sets link rel=canonical
 * and og:url to the same absolute URL.
 */
export default function PageHelmet({
  title,
  canonicalPath,
  canonical,
  noIndex = false,
  children,
}) {
  const canonicalUrl =
    canonical ??
    (canonicalPath != null && canonicalPath !== ""
      ? canonicalPlayUrl(canonicalPath)
      : null);

  return (
    <Helmet>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : null}
      {canonicalUrl ? (
        <>
          <link rel="canonical" href={canonicalUrl} />
          <meta property="og:url" content={canonicalUrl} />
        </>
      ) : null}
      {children}
    </Helmet>
  );
}

PageHelmet.propTypes = {
  title: PropTypes.string.isRequired,
  /** Path only, e.g. `/games/go` — resolved with play.abstractplay.com origin. */
  canonicalPath: PropTypes.string,
  /** Full canonical URL; overrides canonicalPath when both are set. */
  canonical: PropTypes.string,
  /** Exclude from search indexes (live games, profiles, feedback, etc.). */
  noIndex: PropTypes.bool,
  children: PropTypes.node,
};
