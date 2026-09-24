import React from "react";
import { useTranslation } from "react-i18next";
import PageLoading from "./PageLoading";
import { useSiteSummary } from "../../hooks/useSiteSummary";
import { useEnsureSummaryTier } from "../../hooks/useEnsureSummaryTier";
import { SUMMARY_URLS, RECORDS_DOWNLOAD_LINK_REL } from "../../lib/summaryFetch";

function SummaryGate({ children }) {
  const { t } = useTranslation();
  useEnsureSummaryTier("site");
  const { isPending, isReady, isError } = useSiteSummary();

  if (isPending) {
    return <PageLoading message={t("stats.loadingSummary")} />;
  }

  if (isError) {
    return (
      <div className="content has-text-centered summary-gate-error">
        <p>{t("stats.summaryLoadError")}</p>
        <p>
          <a href={SUMMARY_URLS.monolith} rel={RECORDS_DOWNLOAD_LINK_REL}>
            {t("stats.downloadSummary")}
          </a>
        </p>
      </div>
    );
  }

  if (isReady) {
    return children;
  }

  return null;
}

export default SummaryGate;
