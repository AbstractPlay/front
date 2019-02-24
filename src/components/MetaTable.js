import React from 'reactn';
import {graphql, QueryRenderer} from 'react-relay';
import { environment } from '../Environment';
import Spinner from '../components/Spinner';
import { useTranslation } from 'react-i18next';

class MetaTable extends React.Component {
  render() {
    return (
      <QueryRenderer
        environment={environment}
        query={graphql`
          query MetaTableQuery {
            gamesMeta {
              id,
              name,
              shortcode,
              description,
              sampleRep,
              publisher {
                  name,
                  url
              }
            }  
          }
        `}
        variables={{}}
        render={({error, props}) => {
          if (error) {
            return <div><p>Error!</p><p>{error.message}</p></div>;
          }
          if (!props) {
            return <Spinner />;
          }
          return <div>Game Name: {props.gamesMeta[0].name} ({props.gamesMeta[0].id})</div>;
        }}
      />
    );
  }
}

export default MetaTable;
