import { writeFileSync, readFileSync } from "fs";

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <atom:link href="https://play.abstractplay.com/news.rss" rel="self" type="application/rss+xml" />
    <title>Abstract Play News</title>
    <link>https://play.abstractplay.com/news</link>
    <description>Abstract Play is a site that allows you to play abstract strategy board games against other players on the internet. These games are not real-time, meaning your opponent does not need to be online at the same time as you are. You can submit your move and come back later to see if your opponent has moved. We specialize in offbeat, perfect information games without any element of luck.</description>
`;
// load exported JSON file
const data = JSON.parse(readFileSync("c:/users/aaron/onedrive/desktop/announcements.json"));
for (const rec of data.messages) {
    if (rec.content === "") {
        continue;
    }
    let item = `
    <item>
      <title>Announcement</title>
      <description>${escapeXml(escapeXml(rec.content))}</description>
      <link>https://play.abstractplay.com/news</link>
      <pubDate>${new Date(rec.timestamp).toUTCString()}</pubDate>
      <guid isPermaLink="false">${rec.id}</guid>
    </item>
    `;
    rss += item;
}
rss += `
  </channel>
</rss>
`;
writeFileSync("public/news.rss", rss);
console.log("done");
