import React from "react";
import { useTranslation } from "react-i18next";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";
import ReactTimeAgo from "react-time-ago";
import GameCommentShort from "./GameCommentShort";
TimeAgo.addDefaultLocale(en);

//TODO:
// Fix react-time-ago to be language/locale sensitive

function UserChats(props) {
  const comments = props.comments;
  const players = props.players;
  const { t } = useTranslation();

  if (comments) {
    let results = [];
    comments.forEach((c) => {
      if ( (c.userId !== null) && (c.userId !== undefined) && (c.userId.length > 0) ) {
        let personName = "Unknown";
        const player = players.find((p) => p.id === c.userId);
        if (player !== undefined) {
            personName = player.name;
        }
        results.push({
            timestamp: c.timeStamp,
            time: new Date(c.timeStamp).toLocaleString(),
            log: c.comment,
            system: false,
            userid: c.userId,
            player: personName,
        });
      }
    });
    results.sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div style={{paddingTop: "1em"}}>
        <h1 className="subtitle lined">
          <span>{t("GameSummary")}</span>
        </h1>
        <GameCommentShort
          handleSubmit={props.handleSubmit}
          tooMuch={props.tooMuch}
        />
        <div className="chatTable">
        {results.map((r, index) => (
            <div key={"result" + index} className="media">
                <div className="media-content">
                <div className="content">
                    {r.system ? (
                    <p className="chatSystem">
                        <small>
                        <ReactTimeAgo
                            date={r.timestamp}
                            timeStyle="twitter-now"
                        />
                        </small>
                        <br />
                        {r.log}
                    </p>
                    ) : (
                    <p className="chatPlayer">
                        <strong>{r.player}</strong>&nbsp;
                        <small>
                        <ReactTimeAgo
                            date={r.timestamp}
                            timeStyle="twitter-now"
                        />
                        </small>
                        <br />
                        {r.log}
                    </p>
                    )}
                </div>
                </div>
            </div>
        ))}
        </div>
    </div>
    );
  } else {
    return "";
  }
}

export default UserChats;