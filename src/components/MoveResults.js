import React, { useContext, useEffect } from "react";
import { Fragment } from "react";
import { NewChatContext } from "./GameMove";
import { MeContext } from "../pages/Skeleton";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";
import ReactTimeAgo from "react-time-ago";
TimeAgo.addDefaultLocale(en);

//TODO:
// Fix react-time-ago to be language/locale sensitive

function MoveResults(props) {
  const results0 = props.results;
  const comments = props.comments;
  const players = props.players;

  const [, newChatSetter] = useContext(NewChatContext);
  const [globalMe] = useContext(MeContext);

  let results;

  useEffect(() => {
    // Look at the past X chats. If any of them belong to a player other than you, then we have "new chat"
    const threshold = Math.min(4, results.length); // an opponent chat followed by three game turns
    let oppChat = false;
    for (let i = 0; i < threshold; i++) {
      if (!results[i].system && results[i].userid !== globalMe.id) {
        oppChat = true;
        break;
      }
    }
    newChatSetter(oppChat);
  }, [JSON.stringify(results), globalMe, newChatSetter]);

  if (results0) {
    results = results0.map((r) => ({
      time: r.time,
      timestamp: new Date(r.time).getTime(),
      log: r.log,
      system: true,
    }));
    comments.forEach((c) => {
      results.push({
        timestamp: c.timeStamp,
        time: new Date(c.timeStamp).toLocaleString(),
        log: c.comment,
        system: false,
        userid: c.userId,
        player: players.find((p) => p.id === c.userId).name,
      });
    });
    results.sort((a, b) => b.timestamp - a.timestamp);

    return (
      <Fragment>
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
      </Fragment>
    );
    // return (
    //   <table className="table">
    //   <tbody>
    //     { results.map((r, index) =>
    //       <tr key={"moveResult" + index} className={(r.system) ? "chatSystem" : "chatPlayer"}>
    //         <td>[{r.time}]</td>
    //         {/* Seems like JSX automatically sanitizes this, so no need to worry about XSS or use "htmlEscape". */}
    //         <td>{r.log}</td>
    //       </tr>)
    //     }
    //   </tbody>
    // </table>
    // );
  } else {
    return "";
  }
}

export default MoveResults;
