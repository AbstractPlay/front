import PropTypes from "prop-types";
import LocalizedTimeAgo from "../LocalizedTimeAgo";
import CopyDeepLinkButton from "../Stats/CopyDeepLinkButton";
import AnnouncementMarkdown from "./AnnouncementMarkdown";
import AnnouncementReactions from "./AnnouncementReactions";

function AnnouncementArticle({
  item,
  className,
  showReactions,
  myReactions,
  onReactionToggle,
  reactionsDisabled,
  articleRef,
  showCopyLink,
}) {
  const articleClass = className ? `media ${className}` : "media";
  const anchorId = item.id ? `announcement-${item.id}` : undefined;
  return (
    <article
      className={articleClass}
      id={anchorId}
      ref={articleRef}
      data-announcement-id={item.id || undefined}
    >
      <div className="media-content">
        <div className="content">
          <p className="announcement-article-meta">
            <small>
              <LocalizedTimeAgo
                date={item.publishedAt ?? item.time}
                timeStyle="twitter-now"
              />
            </small>
            {showCopyLink && item.id ? (
              <CopyDeepLinkButton
                pathname={`/news/${item.id}`}
                baseClassName="announcement-copy-link"
                copyLabelKey="news.link.copy"
                copiedLabelKey="news.link.copied"
              />
            ) : null}
          </p>
          {item.title && item.title !== "Announcement" ? (
            <h2 className="title is-5 announcement-article-title">{item.title}</h2>
          ) : null}
        </div>
        <AnnouncementMarkdown
          body={item.body ?? item.text}
          attachmentUrlByKey={item.attachmentUrlByKey}
        />
        {showReactions && item.id ? (
          <AnnouncementReactions
            announcementId={item.id}
            reactionCounts={item.reactionCounts}
            myReactions={myReactions}
            onToggle={onReactionToggle}
            disabled={reactionsDisabled}
          />
        ) : null}
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
    reactionCounts: PropTypes.object,
  }).isRequired,
  className: PropTypes.string,
  showReactions: PropTypes.bool,
  myReactions: PropTypes.arrayOf(PropTypes.string),
  onReactionToggle: PropTypes.func,
  reactionsDisabled: PropTypes.bool,
  articleRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  showCopyLink: PropTypes.bool,
};

export default AnnouncementArticle;
