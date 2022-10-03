import React from 'react';

function MoveResults(props) {
  const results0 = props.results;
  const comments = props.comments;
  const players = props.players;

  let results = results0.map(r => ({"time": r.time, "timestamp": new Date(r.time).getTime(), "log": r.log}))
  comments.forEach(c => {
    results.push({"timestamp": c.timeStamp, "time": new Date(c.timeStamp).toLocaleString(), "log": players.find(p => p.id === c.userId).name + " commented: " + c.comment})    
  });
  results.sort((a, b) => b.timestamp - a.timestamp);
  return (
    <table className="moveResultsTable">
    <tbody>
      { results.map((r, index) =>
        <tr key={"moveResult" + index}>
          <td>[{r.time}]</td>
          <td>{r.log}</td>
        </tr>)
      }
    </tbody>
  </table>
  );
}

export default MoveResults;
