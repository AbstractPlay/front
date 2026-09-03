import React from "react";
import Spinner from "../Spinner";

function PageLoading({ message }) {
  return (
    <div className="has-text-centered page-loading">
      <Spinner />
      {message ? <p className="help">{message}</p> : null}
    </div>
  );
}

export default PageLoading;
