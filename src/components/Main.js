import React from 'react';
import About from './About';
import Me from './Me';

function Main(props) {
  // landing page when first connecting to the AP site
  if (props.token === null) {
    // Not logged in. Show available (meta) games.
    return (<About  token={props.token}/>);
  }
  else {
    // Logged in. Show your games in progress and outstanding challenges.
    return (<Me />);
  }
}

export default Main;
