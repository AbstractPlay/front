import React from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import * as serviceWorker from './serviceWorker';
import Skeleton from './pages/Skeleton';
import './index.css';
import './app.css'

require('core-js/es/map');
require('core-js/es/set');
require('core-js/es/promise');
require('core-js/es/object');

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Skeleton />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
