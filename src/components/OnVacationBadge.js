import { useTranslation } from "react-i18next";

/** @param {{ user?: { onVacation?: boolean, bot?: boolean } | null, className?: string }} props */
export default function OnVacationBadge({ user, className = "tag is-light ml-1" }) {
  const { t } = useTranslation();
  if (!user || user.bot || user.onVacation !== true) {
    return null;
  }
  return <span className={className}>{t("OnVacation")}</span>;
}
