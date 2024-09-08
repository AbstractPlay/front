import React, { useContext } from "react";
import { Fragment } from "react";
import ReactTimeAgo from "react-time-ago";
import { UsersContext } from "../../pages/Skeleton";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

//TODO:
// Fix react-time-ago to be language/locale sensitive

function MoveResults(props) {
  const results0 = props.results;
  console.log(results0);
  const comments = props.comments;
  const players = props.players;
  const t = props.t;
  const [users] = useContext(UsersContext);

  let results;

  if (results0) {
    results = results0.map((r) => ({
      time: r.time,
      timestamp: new Date(r.time).getTime(),
      log: r.log,
      system: true,
      ply: r.ply,
    }));
    comments.forEach((c) => {
      if (
        c.userId === null ||
        c.userId === undefined ||
        c.userId.length === 0
      ) {
        results.push({
          timestamp: c.timeStamp,
          time: new Date(c.timeStamp).toLocaleString(),
          log: c.comment,
          system: true,
        });
      } else {
        let personName = "Unknown";
        let player = players.find((p) => p.id === c.userId);
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
      }
    });
    results.sort((a, b) => b.timestamp - a.timestamp);
    console.log(results);

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
                    {!("ply" in r) || r.ply === undefined
                      ? ""
                      : `${t("Ply")} ${r.ply}: `}
                    {r.log}
                  </p>
                ) : (
                  <>
                    <p className="chatPlayer">
                      <strong>{r.player}</strong>&nbsp;
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
