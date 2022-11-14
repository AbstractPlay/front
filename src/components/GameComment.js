import React, { useState, Fragment } from 'react';
import { useTranslation } from 'react-i18next';

function GameComment(props) {
  const [comment, commentSetter] = useState("");
  const { t } = useTranslation();

  const handleChange = (comment) => {
    commentSetter(comment);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    props.handleSubmit(comment);
    commentSetter("");
  }

  return (
    <Fragment>
      <textarea id="enterAComment" value={comment} placeholder={t('Comment')} onChange={(e) => handleChange(e.target.value)} 
        rows={3}
        cols={100} />
      <input type="submit" value="Submit" onClick={handleSubmit}/>
    </Fragment>
  );

}

export default GameComment;
