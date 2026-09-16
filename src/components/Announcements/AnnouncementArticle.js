import PropTypes from "prop-types";
import LocalizedTimeAgo from "../LocalizedTimeAgo";
import AnnouncementMarkdown from "./AnnouncementMarkdown";

function AnnouncementArticle({ item, className }) {
  const articleClass = className ? `media ${className}` : "media";
  return (
    <article className={articleClass}>
      <div className="media-content">
        <div className="content">
          <p>
            <small>
              <LocalizedTimeAgo
                date={item.publishedAt ?? item.time}
                timeStyle="twitter-now"
              />
            </small>
          </p>
          {item.title && item.title !== "Announcement" ? (
            <h2 className="title is-5 announcement-article-title">{item.title}</h2>
          ) : null}
        </div>
        <AnnouncementMarkdown
          body={item.body ?? item.text}
          attachmentUrlByKey={item.attachmentUrlByKey}
        />
      </div>
    </article>
  );
}

AnnouncementArticle.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    body: PropTypes.string,
    text: PropTypes.string,
    time: PropTypes.number,
    publishedAt: PropTypes.number,
    attachmentUrlByKey: PropTypes.object,
  }).isRequired,
  className: PropTypes.string,
};

export default AnnouncementArticle;
