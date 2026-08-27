import React from "react";
import Main from "../components/Main";

function Welcome(props) {
  return <Main update={props.update} />;
}

export default Welcome;
