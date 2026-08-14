import React from "react";
import { useTranslation } from "react-i18next";
import SiteSubNav from "./site/SiteSubNav";
import SiteGrowth from "./site/SiteGrowth";
import SiteGeo from "./site/SiteGeo";
import SiteSeasonality from "./site/SiteSeasonality";
import SiteReliability from "./site/SiteReliability";
import SitePace from "./site/SitePace";
import { useStore } from "../../stores";

function SiteStats({ nav }) {
  const { t } = useTranslation();
  const summary = useStore((state) => state.summary);
  const showSubNav = nav === undefined;
  const hasSeasonality = summary.seasonality?.movesByDow !== undefined;

  return (
    <>
      {showSubNav ? <SiteSubNav /> : null}
      <section id="site-growth" className="stats-site-section">
        <h3 className="subtitle">{t("stats.site.sections.growth")}</h3>
        <SiteGrowth />
      </section>
      <section id="site-geo" className="stats-site-section">
        <h3 className="subtitle">{t("stats.site.sections.geo")}</h3>
        <SiteGeo nav={nav} />
      </section>
      {hasSeasonality ? (
        <section id="site-seasonality" className="stats-site-section">
          <h3 className="subtitle">{t("stats.site.sections.seasonality")}</h3>
          <SiteSeasonality />
        </section>
      ) : null}
      <section id="site-reliability" className="stats-site-section">
        <h3 className="subtitle">{t("stats.site.sections.reliability")}</h3>
        <SiteReliability />
      </section>
      <section id="site-pace" className="stats-site-section">
        <h3 className="subtitle">{t("stats.site.sections.pace")}</h3>
        <SitePace />
      </section>
    </>
  );
}

export default SiteStats;
