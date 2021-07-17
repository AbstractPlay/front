import React, { useContext, useState, createContext, Suspense } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  useHistory,
  useLocation
} from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import './Skeleton.css';
import { Container, Row, Col } from 'react-bootstrap';
import Spinner from '../components/Spinner';
import LogInOutButton from '../components/LogInOutButton';
import Welcome from './Welcome';
import AuthProcessor from '../components/AuthProcessor';

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

  if (sessionStorage.getItem('Nonce') === null) {
    sessionStorage.setItem('Nonce', uuidv4());
  }

  return (
    <ProvideAuth>
      <Router>
        <Container>
          <Row>
            <Col><p>Abstract Play<br/>{t("Make time for games")}</p></Col>
            <Col>Menu</Col>
            <Col><LogInOutButton /></Col>
          </Row>
          <Row>
            <Col>
              <Switch>
                <Route path="/auth">
                  <AuthProcessor />
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
