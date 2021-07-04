import React from 'reactn';
import graphql from 'babel-plugin-relay/macro';
import { QueryRenderer } from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';
import MetaItem from './MetaItem';

class MetaContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <QueryRenderer
        environment={environment}
        query={graphql`
          query MetaContainerQuery {
            gamesMeta {
                id,
              ...MetaItem_item
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
          return (
            <div>
                {props.gamesMeta.map(item => <MetaItem item={item} key={item.id} />)}
            </div>
          );
        }}
      />
    );
  }
}

export default MetaContainer;
