import graphql from 'babel-plugin-relay/macro';
import {commitMutation} from 'react-relay';
import { environment } from '../Environment';

const mutation = graphql`
  mutation GameMoveMutation($input: MoveGameInput!) {
    moveGame(input: $input) {
      id,
      type {
        name
      },
      players {
        id
      },
      whoseTurn {
        id,
        name
      },
      lastState {
        renderrep
      }
    }
  }
`

const GameMoveMutation = (id, move, callback, errcallback) => {
  const variables = {
    input: {
      id,
      move
    },
  }

  commitMutation(
    environment,
    {
      mutation,
      variables,
      onCompleted: (response, errors) => {
        callback(response, errors)
      },
      onError: err => { errcallback(err) },
    },
  )
}

export default GameMoveMutation;
