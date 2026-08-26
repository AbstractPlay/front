import React from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";

const markdownLink = ({ href, children }) => (
  <a href={href} target="_blank" rel="ugc nofollow noopener noreferrer">
    {children}
  </a>
);

const markdownComponents = {
  a: markdownLink,
  img: () => null,
};

export default function ProfileAbout({
  text,
  className = "profile-about content",
}) {
  if (text === undefined || text === null || /^\s*$/.test(text)) {
    return null;
  }
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={className}
      components={markdownComponents}
    >
      {text}
    </ReactMarkdown>
  );
}
