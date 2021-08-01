import React, { useState, useEffect } from 'react';
import MetaContainer from './MetaContainer';
import Me from './Me';
import { useAuth } from '../pages/Skeleton';
import { Auth } from 'aws-amplify';
import Spinner from './Spinner';

function Main() {
  const [authed, authedSetter] = useState(false);

  const auth = useAuth();
  const token = auth.token;

  useEffect(() => {
    Auth.currentAuthenticatedUser().then(usr => {
      console.log('currentAuthenticatedUser', usr);
      auth.setToken(usr.signInUserSession.idToken.jwtToken);
      // for relay Network...
      localStorage.setItem('token', usr.signInUserSession.idToken.jwtToken);
      authedSetter(true);
    }).catch(() => {
      console.log('Not signed in');
      auth.setToken(null);
      localStorage.removeItem('token');
      authedSetter(true);
    });
  },[auth]);

  if (!authed) {
    return <Spinner />;
  }
  else {
    // landing page when first connecting to the AP site
    if (token === null) {
      // Not logged in. Show available (meta) games.
      return (<MetaContainer />);
    }
    else {
      // Logged in. Show your games in progress and outstanding challenges.
      return (<Me />);
    }
  }
}

export default Main;
