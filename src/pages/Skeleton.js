import React, { useState, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { COGNITO_APPID, COGNITO_COOKIE_DOMAIN, COGNITO_REDIRECT_LOGIN, COGNITO_REDIRECT_LOGOUT } from '../config';
import Amplify, { Auth } from 'aws-amplify';
import './Skeleton.css';
import { Container, Row, Col } from 'react-bootstrap';
import Spinner from '../components/Spinner';
import LogInOutButton from '../components/LogInOutButton';
import Welcome from './Welcome';
import GameMove from '../components/GameMove';
import logo from '../assets/logo2.png';

function Bones(props) {
  const { t } = useTranslation();
  const [authed, authedSetter] = useState(false);
  const [token, tokenSetter] = useState(null);

  useEffect(() => {
    const awsconfig = {
      "Auth": {
        "region": "us-east-1",
        "userPoolId": "us-east-1_jQP9BEv25",
        "userPoolWebClientId": COGNITO_APPID,
        "mandatorySignIn": false,
        "cookieStorage": {
          "domain": COGNITO_COOKIE_DOMAIN,
          "path": "/",
          "expires": 7,
          "secure": true
        },
        "redirectSignIn": COGNITO_REDIRECT_LOGIN,
        "redirectSignOut": COGNITO_REDIRECT_LOGOUT
      },
      "API": {
        "endpoints": [
          {
            "name": "demo",
            "endpoint": COGNITO_REDIRECT_LOGIN
          }
        ]
      }
    };
    Amplify.configure(awsconfig);
    const awsauth = {
      "domain": "abstract-play.auth.us-east-1.amazoncognito.com",
      "scope": [
        "openid"
      ],
      "redirectSignIn": COGNITO_REDIRECT_LOGIN,
      "redirectSignOut": COGNITO_REDIRECT_LOGOUT,
      "responseType": "code"
    };
    Auth.configure({ oauth: awsauth });
    async function getToken() {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        console.log(usr);
        // if (usr.signInUserSession !== undefined)
        tokenSetter(usr.signInUserSession.idToken.jwtToken);
      }
      catch (error) {
        tokenSetter(null);
      }
      authedSetter(true);
      console.log("authed");
    }
    getToken();
  },[]);

  if (!authed)
    return <Spinner />;
  else
    return (
      <Router>
        <Container>
          <Row>
            <Col>
              <div>
                <img src={logo} alt="Abstract Play logo"  id="logo" />
              </div> </Col>
            <Col></Col>
            <Col><LogInOutButton token={token} /></Col>
          </Row>
          <Row>
            <Col>
              <Switch>
                <Route path="/move">
                  <GameMove />
                </Route>
                <Route path="/">
                  <Welcome token={token} />
                </Route>
              </Switch>
            </Col>
          </Row>
          <Row>
            <Col>Footer</Col>
          </Row>
        </Container>
      </Router>
    );
}

export default function Skeleton() {
  // The useTranslation hook will trigger a Suspense if not ready
  return (
    <Suspense fallback={<Spinner />}>
      <Bones />
    </Suspense>
  );
}
