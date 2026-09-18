/**
 * Markdown draft for a feedback reply that quotes another message.
 * @param {{ authorName?: string, body?: string, emptyText?: string }} source
 * @returns {string}
 */
export function buildFeedbackReplyDraft({ authorName, body, emptyText = "" }) {
  const name = typeof authorName === "string" ? authorName.trim() : "";
  const text = typeof body === "string" ? body.trim() : "";
  const lines = [];

  if (name) {
    lines.push(`> **${name}** wrote:`);
  }

  if (text) {
    for (const line of text.split("\n")) {
      lines.push(`> ${line}`);
    }
  } else if (emptyText) {
    lines.push(`> ${emptyText}`);
  }

  if (lines.length === 0) {
    return "\n";
  }

  return `${lines.join("\n")}\n\n`;
}
