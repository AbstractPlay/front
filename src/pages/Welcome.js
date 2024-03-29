import React from "react";
import WelcomeBlurb from "../components/WelcomeBlurb";
import Main from "../components/Main";

function Welcome(props) {
  return (
    <>
      <WelcomeBlurb />
      <Main token={props.token} update={props.update} />
    </>
  );
}

export default Welcome;
