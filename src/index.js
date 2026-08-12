import "./polyfills";
import React from "react";
import { createRoot } from "react-dom/client";
import { toast } from "react-toastify";
import "./i18n";
import Skeleton from "./pages/Skeleton";
import ErrorBoundary from "./components/ErrorBoundary";
import I18nGate from "./components/I18nGate";
import "./myBulma.css";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <ErrorBoundary>
    <I18nGate>
      <Skeleton />
    </I18nGate>
  </ErrorBoundary>
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.body === undefined) {
      return;
    }

    const message = data.title ? `${data.title}: ${data.body}` : data.body;
    const url = data.data?.url;
    toast(message, {
      onClick: () => {
        if (url) {
          window.location.href = url;
        }
      },
    });
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("SW registered:", reg);
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });
  });
}
