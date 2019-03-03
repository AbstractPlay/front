import React from 'reactn';
import {createFragmentContainer, graphql} from 'react-relay';
import { Container, Row, Col } from 'react-bootstrap';
import {render} from '@abstractplay/renderer';
import { useTranslation } from 'react-i18next';

const ReactMarkdown = require('react-markdown/with-html');

class MetaItem extends React.Component {
  constructor(props) {
    super(props);
    // create a ref to store the textInput DOM element
    this.sampleImage = React.createRef();
  }

  componentDidMount() {
    render(JSON.parse(this.props.item.sampleRep), {divelem: this.sampleImage.current});
  }

  render() {
    const item = this.props.item;
    return (
      <Container>
        <Row>
          <Col>
            <ReactMarkdown 
              source={`## ${item.name}\n\n${item.description}\n\n&mdash;<a href="${item.publisher.url}">${item.publisher.name}</a>`}
              escapeHtml={false}
            />
          </Col>
          <Col>
            <div ref={this.sampleImage} style={{"height": "15em"}}></div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default createFragmentContainer(
    MetaItem, 
    graphql`
        fragment MetaItem_item on GamesMetaType {
            name,
            shortcode,
            description,
            sampleRep,
            publisher {
                name,
                url
            }
        }`
);
