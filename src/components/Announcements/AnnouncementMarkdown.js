import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { resolveAnnouncementImages } from "../../lib/announcements/resolveAnnouncementImages";

function AnnouncementMarkdown({ body, attachmentUrlByKey, className }) {
  if (!body) {
    return null;
  }
  const markdown = resolveAnnouncementImages(body, attachmentUrlByKey);
  return (
    <ReactMarkdown
      className={className ?? "content announcement-markdown"}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        a: ({ href, children, ...props }) => {
          const external = href && /^https?:\/\//i.test(href);
          return (
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              {...props}
            >
              {children}
            </a>
          );
        },
        img: ({ src, alt, ...props }) => (
          <img
            src={src}
            alt={alt ?? ""}
            className="announcement-inline-image"
            loading="lazy"
            {...props}
          />
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

AnnouncementMarkdown.propTypes = {
  body: PropTypes.string,
  attachmentUrlByKey: PropTypes.object,
  className: PropTypes.string,
};

export default AnnouncementMarkdown;
