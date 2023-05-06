import React from "react";

function DownloadDataUri(props) {

    return (
        <div className="field">
          <div className="control">
            <a href={props.uri} download={props.filename}>
              <button className="button apButton is-small">{props.label}</button>
            </a>
          </div>
        </div>
    );
}

export default DownloadDataUri;
