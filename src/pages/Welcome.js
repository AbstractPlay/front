import React, { Suspense } from 'reactn';
import { useTranslation } from 'react-i18next';
import './Welcome.css';
// import {graphql, QueryRenderer} from 'react-relay';
import { Container, Row, Col } from 'react-bootstrap';
// import { environment } from '../Environment';
import Spinner from '../components/Spinner';
import LogInOutButton from '../components/LogInOutButton';

function MyComponent(props) {
  const { t } = useTranslation();

  return (
      <Container>
        <Row>
          <Col><p>Abstract Play<br/>{t("Make time for games")}</p></Col>
          <Col>Menu</Col>
          <Col><LogInOutButton /></Col>
        </Row>
        <Row>
          <Col>{t("Welcome")}</Col>
        </Row>
        <Row>
          <Col>Footer</Col>
        </Row>
      </Container>
  );
}

export default function Welcome() {
  return (
    <Suspense fallback={<Spinner />}>
      <MyComponent />
    </Suspense>
  );
}

// class App extends Component {
//   render() {
//     return (
//       <QueryRenderer
//         environment={environment}
//         query={graphql`
//           query AppOpenQuery {
//             gamesMeta {
//               id,
//               name
//             }  
//           }
//         `}
//         variables={{}}
//         render={({error, props}) => {
//           if (error) {
//             return <div><p>Error!</p><p>{error.message}</p></div>;
//           }
//           if (!props) {
//             return <div>Loading...</div>;
//           }
//           return <div>Game Name: {props.gamesMeta[0].name} ({props.gamesMeta[0].id})</div>;
//         }}
//       />
//     );
//   }
// }

// export default App;
