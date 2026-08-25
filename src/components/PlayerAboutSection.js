import React, { useEffect, useRef, useState } from "react";
import { API_ENDPOINT_OPEN } from "../config";
import ProfileAbout from "./ProfileAbout";
import { aboutTextPlainSnippet } from "../lib/aboutTextClient";

export default function PlayerAboutSection({ userId, seedAbout, globalMeId, onAboutChange }) {
  const [about, aboutSetter] = useState(
    seedAbout !== undefined && seedAbout !== null && !/^\s*$/.test(seedAbout)
      ? seedAbout
      : null
  );
  const [expanded, expandedSetter] = useState(false);
  const [needsCollapse, needsCollapseSetter] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (userId === undefined || userId === null) {
      return;
    }
    let cancelled = false;
    async function fetchAbout() {
      try {
        const url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append("query", "player_about");
        url.searchParams.append("userId", userId);
        const res = await fetch(url);
        const result = await res.json();
        if (cancelled) return;
        const text = result?.about;
        if (typeof text === "string" && !/^\s*$/.test(text)) {
          aboutSetter(text);
        } else if (userId !== globalMeId) {
          aboutSetter(null);
        }
      } catch (error) {
        if (!cancelled && userId !== globalMeId) {
          aboutSetter(null);
        }
      }
    }
    fetchAbout();
    return () => {
      cancelled = true;
    };
  }, [userId, globalMeId]);

  useEffect(() => {
    if (onAboutChange) {
      onAboutChange(about);
    }
  }, [about, onAboutChange]);

  useEffect(() => {
    if (about === null || expanded) {
      needsCollapseSetter(false);
      return;
    }
    const el = contentRef.current;
    if (!el) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      needsCollapseSetter(el.scrollHeight > el.clientHeight + 2);
    });
    return () => cancelAnimationFrame(raf);
  }, [about, expanded]);

  if (about === null || /^\s*$/.test(about)) {
    return null;
  }

  const bodyClassName = [
    "profile-about-body",
    expanded
      ? "profile-about-body--expanded"
      : "profile-about-body--collapsed",
    !expanded && needsCollapse ? "profile-about-body--fade" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="box profile-about-box">
      <div ref={contentRef} className={bodyClassName}>
        <ProfileAbout text={about} />
      </div>
      {needsCollapse || expanded ? (
        <p className="has-text-centered profile-about-toggle-wrap">
          <button
            type="button"
            className="button is-small is-text profile-about-toggle"
            onClick={() => expandedSetter((v) => !v)}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        </p>
      ) : null}
    </div>
  );
}

export { aboutTextPlainSnippet };
