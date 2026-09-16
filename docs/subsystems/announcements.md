# Announcements (site news)

Public news is loaded from the backend (`announcements_list` / `announcement_get`), not from bundled `news.json`.

## Key files

| File | Role |
|------|------|
| [`loadNews.js`](../src/lib/announcements/loadNews.js) | Bootstrap fetch; falls back to bundled `news.json` if API fails |
| [`announcementApi.js`](../src/lib/announcements/announcementApi.js) | Open API client |
| [`AnnouncementArticle.js`](../src/components/Announcements/AnnouncementArticle.js) | Single post on `/news` |
| [`News.js`](../src/components/News.js) | News page |
| [`useAnnouncementUnread.js`](../src/hooks/useAnnouncementUnread.js) | Server cursor `announcementsLastReadAt` + bell synthetic rows |
| [`AnnouncementReactions.js`](../src/components/Announcements/AnnouncementReactions.js) | Reaction chips on `/news` |

Backend: [Announcements](/backend/subsystems/announcements/).

## Admin composer

| Route | Purpose |
|-------|---------|
| `/announcements/admin` | Draft/published list (admin only) |
| `/announcements/admin/new` | New draft editor |
| `/announcements/admin/:id` | Edit draft or published post |

Publish is disabled unless `VITE_REAL_MODE=production` (matches backend dev publish guard).

## Images

Markdown may use `ap-att:{s3Key}`; the client resolves keys to presigned URLs via `announcement_get` during bootstrap enrichment.
