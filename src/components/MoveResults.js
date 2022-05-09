import React from 'react';

function MoveResults(props) {
  const results = props.results;
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
