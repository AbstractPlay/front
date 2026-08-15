import React from "react";
import { useTranslation } from "react-i18next";
import SiteSubNav from "./site/SiteSubNav";
import SiteGrowth from "./site/SiteGrowth";
import SiteGeo from "./site/SiteGeo";
import SiteSeasonality from "./site/SiteSeasonality";
import SiteReliability from "./site/SiteReliability";
import SitePace from "./site/SitePace";
import CopyDeepLinkButton from "./CopyDeepLinkButton";
import { useStore } from "../../stores";

function SiteSectionHeading({ sectionId, children }) {
  return (
    <div className="stats-section-heading">
      <h3 className="subtitle">{children}</h3>
      <CopyDeepLinkButton hash={`#${sectionId}`} pathname="/stats/site" />
    </div>
  );
}

function SiteStats({ nav }) {
  const { t } = useTranslation();
  const summary = useStore((state) => state.summary);
  const showSubNav = nav === undefined;
  const hasSeasonality = summary.seasonality?.movesByDow !== undefined;

  return (
    <>
      {showSubNav ? <SiteSubNav /> : null}
      <section id="site-growth" className="stats-site-section">
        <SiteSectionHeading sectionId="site-growth">
          {t("stats.site.sections.growth")}
        </SiteSectionHeading>
        <SiteGrowth />
      </section>
      <section id="site-geo" className="stats-site-section">
        <SiteSectionHeading sectionId="site-geo">
          {t("stats.site.sections.geo")}
        </SiteSectionHeading>
        <SiteGeo nav={nav} />
      </section>
      {hasSeasonality ? (
        <section id="site-seasonality" className="stats-site-section">
          <SiteSectionHeading sectionId="site-seasonality">
            {t("stats.site.sections.seasonality")}
          </SiteSectionHeading>
          <SiteSeasonality />
        </section>
      ) : null}
      <section id="site-reliability" className="stats-site-section">
        <SiteSectionHeading sectionId="site-reliability">
          {t("stats.site.sections.reliability")}
        </SiteSectionHeading>
        <SiteReliability />
      </section>
      <section id="site-pace" className="stats-site-section">
        <SiteSectionHeading sectionId="site-pace">
          {t("stats.site.sections.pace")}
        </SiteSectionHeading>
        <SitePace />
      </section>
    </>
  );
}

export default SiteStats;
