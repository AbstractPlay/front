import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

async function copyTextToClipboard(text) {
  if ("clipboard" in navigator) {
    return await navigator.clipboard.writeText(text);
  }
  return document.execCommand("copy", true, text);
}

function CopyDeepLinkButton({
  hash = "",
  pathname,
  className = "",
  baseClassName = "card-header-icon",
  copyLabelKey = "stats.link.copy",
  copiedLabelKey = "stats.link.copied",
}) {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = useCallback(() => {
    const path = pathname ?? window.location.pathname;
    const url = `${window.location.origin}${path}${hash ?? ""}`;
    copyTextToClipboard(url)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 1500);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [hash, pathname]);

  const label = isCopied ? t(copiedLabelKey) : t(copyLabelKey);

  const buttonClass = [baseClassName, className].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={buttonClass || undefined}
      aria-label={label}
      title={label}
      onClick={handleCopyClick}
    >
      <span className="icon">
        <i className="fa fa-link" aria-hidden="true"></i>
      </span>
    </button>
  );
}

export default CopyDeepLinkButton;
