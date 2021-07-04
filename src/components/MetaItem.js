import React from 'reactn';
import graphql from 'babel-plugin-relay/macro';
import {createFragmentContainer} from 'react-relay';
import {Container, Row, Col} from 'react-bootstrap';
import {render} from '@abstractplay/renderer';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'
import { useTranslation } from 'react-i18next';

class MetaItem extends React.Component {
  constructor(props) {
    super(props);
    // create a ref to store the textInput DOM element
    this.sampleImage = React.createRef();
  }

  handleBoardClick = (row, col, piece) => { }

  componentDidMount() {
    render(JSON.parse(this.props.item.sampleRep), this.handleBoardClick, {divelem: this.sampleImage.current});
  }

  render() {
    const item = this.props.item;
    return (
      <Container>
        <Row>
          <Col>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {`## ${item.name}\n\n${item.description}\n\n&mdash;
              <a href="${item.publisher.url}">${item.publisher.name}</a>`}
            </ReactMarkdown>
          </Col>
          <Col>
            <div ref={this.sampleImage} style={{"height": "15em"}}></div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default createFragmentContainer(MetaItem, {
    item: graphql`
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
      });
