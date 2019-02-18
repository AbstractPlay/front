import React, { Component } from 'react';
import './App.css';
import {graphql, QueryRenderer} from 'react-relay';
import { environment } from '../Environment';

class App extends Component {
  render() {
    return (
      <QueryRenderer
        environment={environment}
        query={graphql`
          query AppQuery {
            gamesMeta {
              id,
              name
            }  
          }
        `}
        variables={{}}
        render={({error, props}) => {
          if (error) {
            return <div><p>Error!</p><p>{error.message}</p></div>;
          }
          if (!props) {
            return <div>Loading...</div>;
          }
          return <div>Game Name: {props.gamesMeta[0].name} ({props.gamesMeta[0].id})</div>;
        }}
      />
    );
  }
}

// class App extends Component {
//   render() {
//     return (
//       <div className="App">
//         <header className="App-header">
//           <img src={logo} className="App-logo" alt="logo" />
//           <p>
//             Edit <code>src/App.js</code> and save to reload.
//           </p>
//           <a
//             className="App-link"
//             href="https://reactjs.org"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Learn React
//           </a>
//         </header>
//       </div>
//     );
//   }
// }

export default App;
