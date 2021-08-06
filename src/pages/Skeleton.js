import React, { useContext, useState, createContext, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { COGNITO_APPID, COGNITO_REDIRECT_LOGIN, COGNITO_REDIRECT_LOGOUT } from '../config';
import Amplify, { Auth } from 'aws-amplify';
import './Skeleton.css';
import { Container, Row, Col } from 'react-bootstrap';
import Spinner from '../components/Spinner';
import LogInOutButton from '../components/LogInOutButton';
import Welcome from './Welcome';
import GameMove from '../components/GameMove';

const authContext = createContext();

function ProvideAuth({ children }) {
  const auth = useProvideAuth();

  return (
    <authContext.Provider value={auth}>
      {children}
    </authContext.Provider>
  );
}

function useProvideAuth() {
  const [token, setToken] = useState(null);

  return {
    token,
    setToken
  };
}

function MyComponent(props) {
  const { t } = useTranslation();
  const BodyContent = Welcome;

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
  },[]);

  return (
    <ProvideAuth>
      <Router>
        <Container>
          <Row>
            <Col><p>{t("Abstract Play")}<br/>{t("Make time for games")}</p></Col>
            <Col>{t("Menu")}</Col>
            <Col><LogInOutButton /></Col>
          </Row>
          <Row>
            <Col>
              <Switch>
                <Route path="/move">
                  <GameMove />
                </Route>
                <Route path="/">
                  <BodyContent />
                </Route>
              </Switch>
            </Col>
          </Row>
          <Row>
            <Col>Footer</Col>
          </Row>
        </Container>
      </Router>
    </ProvideAuth>
  );
}

export const useAuth = () => {
  return useContext(authContext);
};

export default function Skeleton() {
  return (
    <Suspense fallback={<Spinner />}>
      <MyComponent />
    </Suspense>
  );
}
