import {
  commitMutation,
  graphql,
} from 'react-relay'
import { environment } from '../Environment'

const mutation = graphql`
  mutation NewProfileMutation($input: NewProfileInput!) {
    createProfile(input: $input) {
      id
    }
  }
`

export default (name, consent, anonymous, country, tagline, callback, errcallback) => {
  const variables = {
    input: {
      name,
      consent,
      anonymous,
      country,
      tagline
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
