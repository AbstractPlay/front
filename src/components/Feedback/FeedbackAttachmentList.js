import PropTypes from "prop-types";
import {
  feedbackAttachmentFilename,
  isFeedbackImageAttachmentKey,
} from "../../lib/feedback/feedbackAttachmentDisplay";

function FeedbackAttachmentList({ attachmentUrls, className }) {
  if (!attachmentUrls?.length) {
    return null;
  }
  return (
    <div className={className ?? "feedback-screenshot-grid"}>
      {attachmentUrls.map(({ key, url }) => (
        isFeedbackImageAttachmentKey(key) ? (
          <a key={key} href={url} target="_blank" rel="noreferrer">
            <img src={url} alt="" className="feedback-screenshot-thumb" />
          </a>
        ) : (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="feedback-file-attachment"
          >
            {feedbackAttachmentFilename(key)}
          </a>
        )
      ))}
    </div>
  );
}

FeedbackAttachmentList.propTypes = {
  attachmentUrls: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  })),
  className: PropTypes.string,
};

export default FeedbackAttachmentList;
