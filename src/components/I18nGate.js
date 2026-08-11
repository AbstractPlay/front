import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import i18n, { normalizeUiLanguage } from "../i18n";
import Spinner from "./Spinner";
import FatalError from "./FatalError";

const INIT_TIMEOUT_MS = 10000;

async function waitForUiLanguage() {
  if (!i18n.isInitialized) {
    await new Promise((resolve) => {
      const onInitialized = () => {
        i18n.off("initialized", onInitialized);
        resolve();
      };
      i18n.on("initialized", onInitialized);
    });
  }

  const uiLanguage = normalizeUiLanguage(i18n.language);
  if (uiLanguage !== i18n.language) {
    await i18n.changeLanguage(uiLanguage);
  } else if (uiLanguage !== "en") {
    await i18n.loadLanguages(uiLanguage);
  }
}

const I18nGate = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!cancelled && !readyRef.current) {
        console.error("i18n init timed out");
        setFailed(true);
      }
    }, INIT_TIMEOUT_MS);

    void waitForUiLanguage()
      .then(() => {
        if (!cancelled) {
          readyRef.current = true;
          setReady(true);
        }
      })
      .catch((err) => {
        console.error("i18n init failed:", err);
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (failed) {
    return <FatalError />;
  }

  if (!ready) {
    return <Spinner />;
  }

  return children;
};

I18nGate.propTypes = {
  children: PropTypes.node.isRequired,
};

export default I18nGate;
