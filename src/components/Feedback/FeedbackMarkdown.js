import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { bggBbcodeToMarkdown } from "../../lib/feedback/bggBbcodeToMarkdown";

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

function FeedbackMarkdown({ children, convertBggBbcode = false }) {
  if (!children) {
    return null;
  }
  const markdown = convertBggBbcode ? bggBbcodeToMarkdown(children) : children;
  return (
    <ReactMarkdown
      className="content feedback-markdown"
      remarkPlugins={[remarkGfm]}
      disallowedElements={["img"]}
      unwrapDisallowed
      components={{ a: FeedbackMarkdownLink }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

FeedbackMarkdown.propTypes = {
  children: PropTypes.string,
  convertBggBbcode: PropTypes.bool,
};

export default FeedbackMarkdown;
