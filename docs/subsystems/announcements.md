# Announcements (site news)

Public news is loaded from the backend (`announcements_list` / `announcement_get`), not from bundled `news.json`.

## Key files

| File | Role |
|------|------|
| [`loadNews.js`](../src/lib/announcements/loadNews.js) | Bootstrap fetch; falls back to bundled `news.json` if API fails |
| [`announcementApi.js`](../src/lib/announcements/announcementApi.js) | Open API client |
| [`AnnouncementArticle.js`](../src/components/Announcements/AnnouncementArticle.js) | Single post on `/news` |
| [`News.js`](../src/components/News.js) | News page |
| [`useUnreadNews.js`](../src/hooks/useUnreadNews.js) | Bell badge (interim `news-last-seen` until Phase 4 server cursor) |

Backend: [Announcements](/backend/subsystems/announcements/).

## Images

Markdown may use `ap-att:{s3Key}`; the client resolves keys to presigned URLs via `announcement_get` during bootstrap enrichment.
