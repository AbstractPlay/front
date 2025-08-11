import React, { useContext, useEffect, useRef } from "react";
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
  const handleGameMoveClick = props.handleGameMoveClick;
  const focusedPath = props.focusedPath;
  const chatTableRef = useRef(null);
  const highlightedRefs = useRef([]);
  //   const { t } = useTranslation();

  // Helper function to check if two paths match
  const pathsMatch = (path1, path2) => {
    if (!path1 || !path2) return false;
    if (path1.moveNumber !== path2.moveNumber) return false;
    const exPath1 = path1.exPath || [];
    const exPath2 = path2.exPath || [];
    if (exPath1.length !== exPath2.length) return false;
    return exPath1.every((val, idx) => val === exPath2[idx]);
  };

  // Scroll to highlighted comments when focus changes
  useEffect(() => {
    if (comments && chatTableRef.current && highlightedRefs.current.length > 0) {
      const firstHighlighted = highlightedRefs.current[0];
      if (firstHighlighted) {
        // Get the container's position
        const containerRect = chatTableRef.current.getBoundingClientRect();
        const elementRect = firstHighlighted.getBoundingClientRect();
        
        // Calculate if element is outside visible area
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          // Scroll the element to the top of the container
          chatTableRef.current.scrollTop = firstHighlighted.offsetTop - chatTableRef.current.offsetTop;
        }
      }
    }
    // Reset refs for next render
    highlightedRefs.current = [];
  }, [focusedPath, comments]);

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
        const isHighlighted = focusedPath && c.path && pathsMatch(focusedPath, c.path);
        results.push({
          timestamp: c.timeStamp,
          time: new Date(c.timeStamp).toLocaleString(),
          log: c.comment,
          system: false,
          userid: c.userId,
          player: personName,
          inGame: c.inGame,
          path: c.path,
        });
        // Only show user's comment if it's at the currently focused move
        if (c.userId === props.userId && props.commentingCompletedGame && isHighlighted) {
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
          commentingCompletedGame={props.commentingCompletedGame}
        />
        <div className="chatTable" ref={chatTableRef}>
          {results.map((r, index) => {
            const isHighlighted = focusedPath && r.path && pathsMatch(focusedPath, r.path);
            return (
              <div 
                key={"result" + index} 
                className={`media ${isHighlighted ? 'highlighted-comment' : ''}`}
                ref={isHighlighted ? (el) => { if (el) highlightedRefs.current.push(el); } : null}
              >
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
                        <small style={{ opacity: 0.7 }}>
                          <ReactTimeAgo
                            date={r.timestamp}
                            timeStyle="twitter-now"
                          />
                          {props.commentingCompletedGame && (
                            <span>
                              {r.inGame ? ", in-game" : ", post-game"}
                            </span>
                          )}
                          {r.path && handleGameMoveClick && (
                            <span>
                              {" "}
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleGameMoveClick(r.path);
                                }}
                                style={{ textDecoration: "underline" }}
                              >
                                move
                              </a>
                            </span>
                          )}
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
            );
          })}
        </div>
      </>
    );
  } else {
    return "";
  }
}

export default UserChats;
