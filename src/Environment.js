import { GRAPHQL_ENDPOINT_OPEN/*, GRAPHQL_ENDPOINT_AUTH*/ } from './config';

const {
    Environment,
    Network,
    RecordSource,
    Store,
  } = require('relay-runtime')

  const store = new Store(new RecordSource())

  const network = Network.create((operation, variables) => {
    console.log(operation);
    var optext = operation.text.replace(/\n/g, "");
    return fetch(`${GRAPHQL_ENDPOINT_OPEN}?query=${encodeURIComponent(optext)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      // body: JSON.stringify({
      //   query: operation.text,
      //   variables,
      // }),
    }).then(response => {
      return response.json()
    })
  })

  const environment = new Environment({
    network,
    store,
  })

  export {environment};
