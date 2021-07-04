import graphql from 'babel-plugin-relay/macro';
import { commitMutation } from 'react-relay'
import { environment } from '../Environment'

const mutation = graphql`
  mutation NewChallengeMutation($input: NewChallengeInput!) {
    issueChallenge(input: $input) {
      id
    }
  }
`

export default (game, opponent, callback, errcallback) => {
  const variables = {
    input: {
      game: game,
      numPlayers: 2,
      variants: [],
      challengees: opponent
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
