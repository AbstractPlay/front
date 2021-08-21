import { GRAPHQL_ENDPOINT_OPEN, GRAPHQL_ENDPOINT_AUTH } from './config';

const {
    Environment,
    Network,
    RecordSource,
    Store,
  } = require('relay-runtime');

  const store = new Store(new RecordSource());

  const network = Network.create((operation, variables) => {
    const token = localStorage.getItem('token');
    if (token === null) {
      var optext = operation.text.replace(/\n/g, "");
      return fetch(`${GRAPHQL_ENDPOINT_OPEN}?query=${encodeURIComponent(optext)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(response => {
        return response.json();
      })
    } else {
      console.log(JSON.stringify({
        query: operation.text,
        variables,
      }));
      return fetch(`${GRAPHQL_ENDPOINT_AUTH}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: operation.text,
          variables
        }),
      }).then(response => {
        return response.json()
      })
    }
  })

  const environment = new Environment({
    network,
    store,
  })

  export {environment};
