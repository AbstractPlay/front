import React, {useEffect, useRef} from 'react';
import {Container, Row, Col} from 'react-bootstrap';
import {render} from '@abstractplay/renderer';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'

function MetaItem(props) {

  const handleBoardClick = (row, col, piece) => { }

  useEffect(() => {
    render(JSON.parse(props.item.sampleRep), handleBoardClick, {divelem: sampleImage.current});
  },[props.item.sampleRep]);

  const sampleImage = useRef();
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
          <div ref={sampleImage} style={{"height": "15em"}}></div>
        </Col>
      </Row>
    </Container>
  );
}

export default MetaItem;
