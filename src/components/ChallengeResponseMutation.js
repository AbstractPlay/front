import graphql from 'babel-plugin-relay/macro';
import {commitMutation} from 'react-relay';
import { environment } from '../Environment';

const mutation = graphql`
  mutation ChallengeResponseMutation($input: RespondChallengeInput!) {
    respondChallenge(input: $input) {
      id
    }
  }
`

export default (id, confirmed, callback, errcallback) => {
  const variables = {
    input: {
      id,
      confirmed
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
