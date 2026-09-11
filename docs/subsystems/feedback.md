# Feedback (bugs, ideas, wishlist)

In-app feedback replaces Discord forum workflows for bug reports, feature ideas, and the game wishlist.

## Routes

| Path | Component | Auth |
|------|-----------|------|
| `/feedback/bugs` | Bug board | Open |
| `/feedback/ideas` | Feature ideas board | Open |
| `/wishlist` | Game wishlist board | Open |
| `/feedback/new?kind=bug\|feature\|wishlist` | Submit form | Signed in |
| `/feedback/:id` | Detail + comments | Open (auth adds vote/watch state) |
| `/feedback/mine` | User's submissions | Signed in |
| `/feedback/admin` | Admin triage | Admin |

## Kinds

- **bug** — screenshots optional; bug context captured from error pages
- **feature** — markdown body; attachments supported
- **wishlist** — game title, HTTPS URL, notes; dedup by BGG id or normalized URL

## API

Open queries: `feedback_list`, `feedback_get`, `wishlist_search`.

Auth queries: `feedback_create`, `feedback_vote`, `feedback_comment`, `feedback_subscribe`, `feedback_update`, `feedback_set_status`, `feedback_set_admin_fields`, `feedback_mine`, `feedback_admin_list`, `feedback_delete` (wishlist admin), `feedback_merge` (wishlist admin).

See [node-backend API docs](/backend/api/auth-queries/) and [public queries](/backend/api/public-queries/).

## Notifications

Watchers receive in-app notifications for replies (`feedbackReply`), status changes (`feedbackStatus`), and wishlist deletions (`feedbackDeleted`). Authors are auto-subscribed on create.

## SEO

Feedback routes use `noindex, nofollow` and are excluded from `robots.txt` and the sitemap.

## Imports (ops)

- BGG wishlist: `npm run import-bgg-wishlist` in node-backend (`--map bin/bgg-ap-user-map.json` for BGG username → AP user UUID; auto-match by AP display name when unmapped; mapped authors get auto-vote/subscribe except BGG submitter Striton)
- Discord forums: `npm run import-discord-feedback` in node-backend (`--map bin/discord-ap-user-map.json`; dry-run by default; shared map for bugs + features)
- Discord user report: `npm run report-discord-feedback-users` (`--emit-map` merges unmatched Discord user IDs into `discord-ap-user-map.json`)
- BGG user report: `npm run report-bgg-wishlist-users` (`--emit-map` writes a starter map for unmatched submitters)

Placeholder map files live in `node-backend/bin/` (`bgg-ap-user-map.json`, `discord-ap-user-map.json`; see `.example.json` for format).

Live imports run at pre-production cutover, not during normal dev.
