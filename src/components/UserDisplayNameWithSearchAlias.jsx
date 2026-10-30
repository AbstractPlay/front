import { useTranslation } from "react-i18next";
import { getDisplayNameSearchAlias } from "../lib/displayNameSearch";

/**
 * Renders a display name with an optional muted Latin search alias in parentheses.
 *
 * @param {{ name: string, className?: string, aliasClassName?: string }} props
 */
export default function UserDisplayNameWithSearchAlias({
  name,
  className,
  aliasClassName = "display-name-search-alias",
}) {
  const { t } = useTranslation();
  const alias = getDisplayNameSearchAlias(name);

  return (
    <>
      <span className={className}>{name}</span>
      {alias ? (
        <span
          className={aliasClassName}
          title={t("playerPicker.searchAliasTitle", { alias })}
        >
          {" "}
          ({alias})
        </span>
      ) : null}
    </>
  );
}
