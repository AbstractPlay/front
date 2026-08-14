import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../../../stores";

const ALL_SITE_SECTIONS = [
  { id: "growth", nameKey: "stats.site.sections.growth" },
  { id: "geo", nameKey: "stats.site.sections.geo" },
  { id: "seasonality", nameKey: "stats.site.sections.seasonality" },
  { id: "reliability", nameKey: "stats.site.sections.reliability" },
  { id: "pace", nameKey: "stats.site.sections.pace" },
];

function SiteSubNav() {
  const { t } = useTranslation();
  const summary = useStore((state) => state.summary);

  const sections = useMemo(() => {
    const hasSeasonality = summary.seasonality?.movesByDow !== undefined;
    return ALL_SITE_SECTIONS.filter(
      (section) => section.id !== "seasonality" || hasSeasonality
    );
  }, [summary]);

  return (
    <nav className="stats-site-subnav" aria-label={t("stats.site.subnavLabel")}>
      <ul>
        {sections.map(({ id, nameKey }) => (
          <li key={id}>
            <a href={`#site-${id}`}>{t(nameKey)}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default SiteSubNav;
