import React, { useContext } from "react";
import { Link } from "react-router-dom";
// import { useTranslation } from "react-i18next";
import ReactTimeAgo from "react-time-ago";
import { UsersContext } from "../../pages/Skeleton";
import GameCommentShort from "./GameCommentShort";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

//TODO:
// Fix react-time-ago to be language/locale sensitive

function UserChats(props) {
  const comments = props.comments;
  const players = props.players;
  const gameid = props.gameid;
  const [users] = useContext(UsersContext);
  //   const { t } = useTranslation();

  if (comments) {
    let results = [];
    let mycomment = "";
    comments.forEach((c) => {
      if (c.userId !== null && c.userId !== undefined && c.userId.length > 0) {
        let personName = "Unknown";
        let player = players?.find((p) => p.id === c.userId);
        if (player !== undefined) {
          personName = player.name;
        } else if (users !== null) {
          player = users.find((p) => p.id === c.userId);
          if (player !== undefined) {
            personName = player.name;
          }
        }
        results.push({
          timestamp: c.timeStamp,
          time: new Date(c.timeStamp).toLocaleString(),
          log: c.comment,
          system: false,
          userid: c.userId,
          player: personName,
        });
        if (c.userId === props.userId && props.exploringCompletedGame) {
          mycomment = c.comment;
        }
      }
    });
    results.sort((a, b) => b.timestamp - a.timestamp);

    return (
      <>
        <GameCommentShort
          key={`chatkey_${gameid}`}
          handleSubmit={props.handleSubmit}
          tooMuch={props.tooMuch}
          comment={mycomment}
          exploringCompletedGame={props.exploringCompletedGame}
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
                    <>
                      <p>
                        <Link to={`/player/${r.userid}`}>
                          <strong>{r.player}</strong>
                        </Link>
                        &nbsp;
                        <small>
                          <ReactTimeAgo
                            date={r.timestamp}
                            timeStyle="twitter-now"
                          />
                        </small>
                      </p>
                      <ReactMarkdown
                        className="content"
                        disallowedElements={["img"]}
                        unwrapDisallowed={true}
                      >
                        {r.log}
                      </ReactMarkdown>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  } else {
    return "";
  }
}

export default UserChats;
