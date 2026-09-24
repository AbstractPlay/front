import React from "react";
import Main from "../components/Main";
import PageHelmet from "../components/PageHelmet";
import { getDefaultDocumentTitle } from "../lib/siteDocumentTitle";

function Welcome(props) {
  return (
    <>
      <PageHelmet
        title={getDefaultDocumentTitle()}
        canonicalPath="/"
      />
      <Main update={props.update} />
    </>
  );
}

export default Welcome;
