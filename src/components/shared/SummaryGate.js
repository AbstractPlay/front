import React from "react";
import { useTranslation } from "react-i18next";
import Spinner from "../Spinner";
import { useSiteSummary } from "../../hooks/useSiteSummary";
import { useEnsureSummaryTier } from "../../hooks/useEnsureSummaryTier";
import { SUMMARY_URLS } from "../../lib/summaryFetch";

function SummaryGate({ children }) {
  const { t } = useTranslation();
  useEnsureSummaryTier("site");
  const { isPending, isReady, isError } = useSiteSummary();

  if (isPending) {
    return (
      <div className="has-text-centered summary-gate-loading">
        <Spinner />
        <p className="help">{t("stats.loadingSummary")}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="content has-text-centered summary-gate-error">
        <p>{t("stats.summaryLoadError")}</p>
        <p>
          <a href={SUMMARY_URLS.monolith}>{t("stats.downloadSummary")}</a>
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
