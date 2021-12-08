import React from 'react';

function MoveResults(props) {
  const results = props.results;
  return (
    <table className="moveResultsTable">
    <tbody>
      { results.map((r, index) =>
        <tr key={"moveResult" + index}>
          <td>SYSTEM</td>
          <td>{r}</td>
        </tr>)
      }
    </tbody>
  </table>
  );
}

export default MoveResults;
