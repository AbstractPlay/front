import React from 'react';

function MoveResults(props) {
  const results0 = props.results;
  const comments = props.comments;
  const players = props.players;

  if (results0) {
    let results = results0.map(r => ({"time": r.time, "timestamp": new Date(r.time).getTime(), "log": r.log, "system": true}))
    comments.forEach(c => {
      results.push({"timestamp": c.timeStamp, "time": new Date(c.timeStamp).toLocaleString(), "log": players.find(p => p.id === c.userId).name + " commented: " + c.comment, "system": false})
    });
    results.sort((a, b) => b.timestamp - a.timestamp);
    return (
      <table className="moveResultsTable">
      <tbody>
        { results.map((r, index) =>
          <tr key={"moveResult" + index} className={(r.system) ? "chatSystem" : "chatPlayer"}>
            <td>[{r.time}]</td>
            {/* Seems like JSX automatically sanitizes this, so no need to worry about XSS or use "htmlEscape". */}
            <td>{r.log}</td>
          </tr>)
        }
      </tbody>
    </table>
    );
  } else {
    return '';
  }
}

export default MoveResults;
