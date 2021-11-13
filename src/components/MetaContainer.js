import React from 'react';
import MetaItem from './MetaItem';
import { gameinfo } from '@abstractplay/gameslib';

function MetaContainer(props) {
  return (
    <div>
      <h1>Available games</h1>
      <table>
        <tbody>
          {[...gameinfo.keys()].map(k =>
            <MetaItem key={gameinfo.get(k).uid} game={gameinfo.get(k)} />)
          }
        </tbody>
      </table>
    </div>
  );
}

export default MetaContainer;
