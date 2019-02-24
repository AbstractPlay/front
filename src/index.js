import React, { setGlobal, getGlobal, addCallback } from 'reactn';
import ReactDOM from 'react-dom';
import './i18n';
import {environment} from  './Environment';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { BrowserProtocol, queryMiddleware } from 'farce';
import createFarceRouter from 'found/lib/createFarceRouter';
import createRender from 'found/lib/createRender';
import makeRouteConfig from 'found/lib/makeRouteConfig';
import Route from 'found/lib/Route';
import { Resolver } from 'found-relay';
import Skeleton from './pages/Skeleton';
import AuthProcessor from './components/AuthProcessor';
import RedirectLogin from './components/RedirectLogin';
import RedirectLogout from './components/RedirectLogout';
import { RedirectException } from 'found';

require('core-js/es6/map');
require('core-js/es6/set');
require('core-js/es6/promise');
require('core-js/es6/object');

// Persist global state to sessionStorage
addCallback(global => {sessionStorage.setItem("state", JSON.stringify(global));});

// Set an initial global state directly:
const uuidv4 = require('uuid/v4');
const cached = sessionStorage.getItem("state");
if (cached !== null) {
  setGlobal(JSON.parse(cached));
} else {
  setGlobal({
    token: null,
    nonce: uuidv4(),
    redirect: "/"
  });
}

const routeConfig = makeRouteConfig(
  <Route path="/">
    <Route Component={Skeleton} />
    <Route path="auth" Component={AuthProcessor} />
    <Route path="redirect">
      <Route render={() => {throw new RedirectException("/");}} />
      <Route path="login" Component={RedirectLogin} render={() => {return(<RedirectLogin nonce={getGlobal().nonce} />)}} />
      <Route path="logout" Component={RedirectLogout} />
    </Route>
  </Route>
);

const Router = createFarceRouter({
    historyProtocol: new BrowserProtocol(),
    historyMiddlewares: [queryMiddleware],
    routeConfig,
  
    render: createRender({}),
  });

// ReactDOM.render(<App />, document.getElementById('root'));
ReactDOM.render(
    <Router resolver={new Resolver(environment)} />,
    document.getElementById('root'),
  );

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
