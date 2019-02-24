import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import './i18n';
import {environment} from  './Environment';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { BrowserProtocol, queryMiddleware } from 'farce';
import { createFarceRouter, createRender, makeRouteConfig, Route } from 'found';
import { Resolver } from 'found-relay';
import Welcome from './pages/Welcome';
import AuthProcessor from './components/AuthProcessor';

require('core-js/es6/map');
require('core-js/es6/set');
require('core-js/es6/promise');
require('core-js/es6/object');

// Set an initial global state directly:
const uuidv4 = require('uuid/v4');
setGlobal({
  token: null,
  nonce: uuidv4()
});

const routeConfig = makeRouteConfig(
  <Route path="/" Component={Welcome}>
    <Route path="auth" Component={AuthProcessor}>
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
