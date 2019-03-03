import React from 'reactn';
import {graphql, QueryRenderer} from 'react-relay';
import { environment } from '../Environment';
import Spinner from './Spinner';
import MetaItem from './MetaItem';
import { useTranslation } from 'react-i18next';

class MetaContainer extends React.Component {
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
