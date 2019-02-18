import React from 'react';
import ReactDOM from 'react-dom';
import './i18n';
import './index.css';
import App from './pages/App';
import * as serviceWorker from './serviceWorker';
require('core-js/es6/map');
require('core-js/es6/set');
require('core-js/es6/promise');
require('core-js/es6/object');

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
