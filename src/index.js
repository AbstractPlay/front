import React from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import Skeleton from "./pages/Skeleton";
import "./myBulma.css";
import "./index.css";

require("core-js/es/map");
require("core-js/es/set");
require("core-js/es/promise");
require("core-js/es/object");

//identify if you are on development or production
//when you build your app process.env.NODE_ENV is set to 'production'
const env = process.env.NODE_ENV;

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Skeleton />);

if ("serviceWorker" in navigator) {
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
