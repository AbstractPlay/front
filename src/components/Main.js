import React from "react";
import About from "./About";
import Me from "./Me";
import { useAuthSession } from "../hooks/useAuthSession";

function Main(props) {
  const { status } = useAuthSession();

  // landing page when first connecting to the AP site
  if (status !== "ready") {
    // Not logged in. Show available (meta) games.
    return <About />;
  }

  // Logged in. Show your games in progress and outstanding challenges.
  console.log(`Main props.update = ${props.update}`);
  return <Me update={props.update} />;
}

export default Main;
