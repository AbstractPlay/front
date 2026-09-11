/**
 * Convert common BGG geeklist bbcode in imported wishlist notes to markdown.
 * User-authored AP markdown is left compatible (only known bbcode patterns match).
 */
export function bggBbcodeToMarkdown(text) {
  if (!text) {
    return text;
  }
  let out = text;
  out = out.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, "[$2]($1)");
  out = out.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "**$1**");
  out = out.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "*$1*");
  out = out.replace(
    /\[family=(\d+)\]([\s\S]*?)\[\/family\]/gi,
    "[$2](https://boardgamegeek.com/boardgamefamily/$1)",
  );
  out = out.replace(
    /\[thing=(\d+)\]([\s\S]*?)\[\/thing\]/gi,
    "[$2](https://boardgamegeek.com/boardgame/$1)",
  );
  out = out.replace(/\[imageid=\d+\s+[^\]]*\]/gi, "");
  return out;
}
