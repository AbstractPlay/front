import React, { useState, Fragment } from 'react';
import { useTranslation } from 'react-i18next';

function GameComment(props) {
  const [comment, commentSetter] = useState("");
  const [toolong, toolongSetter] = useState(false)
  const { t } = useTranslation();

  const handleChange = (comment) => {
    toolongSetter(comment.length > 4000);
    commentSetter(comment);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    props.handleSubmit(comment.substring(0, 4000));
    commentSetter("");
  }

  return (
    <Fragment>
      { toolong || props.tooMuch ? <div className="commenttoolong error">{props.tooMuch ? t('CommentsTooLong') : t('CommentTooLong')}</div> : ''}
      <textarea id="enterAComment" value={comment} placeholder={t('Comment')} onChange={(e) => handleChange(e.target.value)} 
        rows={3}
        cols={100} />
      <input type="submit" value="Submit" onClick={handleSubmit}/>
    </Fragment>
  );

}

export default GameComment;
