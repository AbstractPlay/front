import React, {useEffect, useRef} from 'react';
import {Container, Row, Col} from 'react-bootstrap';
import {render} from '@abstractplay/renderer';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'

function MetaItem(props) {

  useEffect(() => {
    render(JSON.parse(props.item.sampleRep), { "divid": "svg" + props.item.name });
  },[props.item.sampleRep]);

  const item = props.item;
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
          <div id={"svg" + item.name} style={{"height": "15em"}}></div>
        </Col>
      </Row>
    </Container>
  );
}

export default MetaItem;
