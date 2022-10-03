import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function GameComment(props) {
  const [comment, commentSetter] = useState(null);
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
    <form onSubmit={handleSubmit}>
      <textarea id="enterAComment" value={comment} placeholder={t('Comment')} onChange={(e) => handleChange(e.target.value)} 
        rows={3}
        cols={100} />
      <input type="submit" value="Submit" />
    </form>
  );
}

export default GameComment;
