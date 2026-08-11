import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import i18n from "../i18n";
import Spinner from "./Spinner";
import FatalError from "./FatalError";

const INIT_TIMEOUT_MS = 10000;

const I18nGate = ({ children }) => {
  const [ready, setReady] = useState(i18n.isInitialized);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (i18n.isInitialized) {
      return undefined;
    }

    let cancelled = false;

    const onInitialized = () => {
      if (!cancelled) {
        setReady(true);
      }
    };

    const timeoutId = window.setTimeout(() => {
      if (!cancelled && !i18n.isInitialized) {
        console.error("i18n init timed out");
        setFailed(true);
      }
    }, INIT_TIMEOUT_MS);

    i18n.on("initialized", onInitialized);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      i18n.off("initialized", onInitialized);
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
