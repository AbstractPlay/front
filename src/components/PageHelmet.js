import React from "react";
import { Helmet } from "react-helmet-async";

/**
 * Sets document.title and og:title from the same string so tab labels match
 * social preview titles.
 */
export default function PageHelmet({ title, children }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      {children}
    </Helmet>
  );
}
