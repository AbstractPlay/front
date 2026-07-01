import React, { useState } from "react";

function ClipboardCopy({ copyText }) {
  const [isCopied, setIsCopied] = useState(false);

  async function copyTextToClipboard(text) {
    if ("clipboard" in navigator) {
      return await navigator.clipboard.writeText(text);
    } else {
      return document.execCommand("copy", true, text);
    }
  }

  const handleCopyClick = () => {
    copyTextToClipboard(copyText)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 1500);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="field">
      <div className="control">
        <input className="input" type="text" value={copyText} readOnly />
      </div>
      <div className="control">
        <button className="button apButtonNeutral" onClick={handleCopyClick}>
          <span>{isCopied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}

export default ClipboardCopy;
