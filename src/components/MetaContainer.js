import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import MetaItem from './MetaItem';
import { API_ENDPOINT_OPEN } from '../config';

function MetaContainer(props) {
  const [error, errorSetter] = useState(null);
  const [games, gamesSetter] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        var url = new URL(API_ENDPOINT_OPEN);
        url.searchParams.append('query', 'list_games');
        const res = await fetch(url);
        const result = await res.json();
        gamesSetter(result);
      }
      catch (error) {
        errorSetter(error);
      }
    }
    fetchData();
  }, []);

  if (error) {
    return <div><p>Error!</p><p>{JSON.stringify(error)}</p></div>;
  }
  if (!games) {
    return <Spinner />;
  }
  return (
    <div>
        {games.map(item => <MetaItem item={item} key={item.name} />)}
    </div>
  );
}

export default MetaContainer;
