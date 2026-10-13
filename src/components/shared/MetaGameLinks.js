import { useTranslation } from "react-i18next";
import { useRulesMirrorManifest } from "../../hooks/useRulesMirrorManifest";
import { rulesMirrorOk, rulesMirrorPdfUrl } from "../../lib/rulesMirror";

/**
 * External URLs, optional rules PDF mirror, and AP wiki — game meta Summary and in-play info.
 */
export default function MetaGameLinks({ metaGame, urls = [] }) {
  const { t } = useTranslation();
  const rulesMirrorManifest = useRulesMirrorManifest();

  return (
    <ul className="contained">
      {urls.map((l, i) => (
        <li key={i}>
          <a href={l} target="_blank" rel="noopener noreferrer">
            {l}
          </a>
        </li>
      ))}
      {rulesMirrorManifest !== null &&
      rulesMirrorOk(rulesMirrorManifest, metaGame) ? (
        <li key="_rules_mirror">
          <a
            href={rulesMirrorPdfUrl(metaGame)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("meta.rulesMirrorLink")}
          </a>
        </li>
      ) : null}
      <li key="_wiki">
        <a
          href={`https://abstractplay.com/wiki/doku.php?id=games:${metaGame}`}
          target="_blank"
          rel="noreferrer"
        >
          {t("meta.wikiLink")}
        </a>
      </li>
    </ul>
  );
}
