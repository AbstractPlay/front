import React from "react";
import { useTranslation } from "react-i18next";

function GlickoHint({ children, className = "glicko-hint" }) {
  const { t } = useTranslation();

  return (
    <abbr title={t("glicko.displayHint")} className={className}>
      {children ?? t("tables.glicko")}
    </abbr>
  );
}

export default GlickoHint;
