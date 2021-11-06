import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import MetaItem from './MetaItem';
import { API_ENDPOINT_OPEN } from '../config';
import { gameinfo } from '@abstractplay/gameslib';

function MetaContainer(props) {
  return (
    <div>
      <h1>Available games</h1>
      <table>
        {[...gameinfo.keys()].filter(k => gameinfo.get(k).uid !== 'entropy').map(k =>
          <MetaItem key={gameinfo.get(k).uid} game={gameinfo.get(k)} />)
        }
      </table>
    </div>
  );
}

export default MetaContainer;
