import React from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import * as serviceWorker from "./serviceWorker";
import Skeleton from "./pages/Skeleton";
import "./myBulma.css";
import "./index.css";
// import the GTM Module so you can access it
import TagManager from "react-gtm-module";

require("core-js/es/map");
require("core-js/es/set");
require("core-js/es/promise");
require("core-js/es/object");

//identify if you are on development or production
//when you build your app process.env.NODE_ENV is set to 'production'
const env = process.env.NODE_ENV;

if (env === "production") {
    const tagManagerArgs = {
        gtmId: "G-TKD64QKZ99",
    };
    TagManager.initialize(tagManagerArgs);
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Skeleton />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
