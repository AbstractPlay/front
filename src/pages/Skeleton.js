import React, { Suspense } from 'reactn';
import { useTranslation } from 'react-i18next';
import './Skeleton.css';
import { Container, Row, Col } from 'react-bootstrap';
import Spinner from '../components/Spinner';
import LogInOutButton from '../components/LogInOutButton';
import Welcome from './Welcome';

function MyComponent(props) {
  const { t } = useTranslation();

  const BodyContent = Welcome;

  return (
      <Container>
        <Row>
          <Col><p>Abstract Play<br/>{t("Make time for games")}</p></Col>
          <Col>Menu</Col>
          <Col><LogInOutButton /></Col>
        </Row>
        <Row>
          <Col><BodyContent /></Col>
        </Row>
        <Row>
          <Col>Footer</Col>
        </Row>
      </Container>
  );
}

export default function Skeleton() {
  return (
    <Suspense fallback={<Spinner />}>
      <MyComponent />
    </Suspense>
  );
}
