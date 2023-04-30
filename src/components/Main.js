import React from "react";
import About from "./About";
import Me from "./Me";

function Main(props) {
  // landing page when first connecting to the AP site
  if (props.token === null) {
    // Not logged in. Show available (meta) games.
    return <About token={props.token} />;
  } else {
    // Logged in. Show your games in progress and outstanding challenges.
    console.log(`Main props.update = ${props.update}`);
    return <Me update={props.update} />;
  }
}

export default Main;
