import React, { useContext, useState, createContext, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import awsconfig from '../config/awsconfig';
import awsauth from '../config/awsauth';
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
    Amplify.configure(awsconfig);
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
