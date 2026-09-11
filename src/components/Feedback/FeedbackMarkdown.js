import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function FeedbackMarkdownLink({ href, children, ...props }) {
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
}

function FeedbackMarkdown({ children }) {
  if (!children) {
    return null;
  }
  return (
    <ReactMarkdown
      className="content feedback-markdown"
      remarkPlugins={[remarkGfm]}
      disallowedElements={["img"]}
      unwrapDisallowed
      components={{ a: FeedbackMarkdownLink }}
    >
      {children}
    </ReactMarkdown>
  );
}

FeedbackMarkdown.propTypes = {
  children: PropTypes.string,
};

export default FeedbackMarkdown;
