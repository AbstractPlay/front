# Feedback (bugs, ideas, wishlist)

In-app feedback replaces Discord forum workflows for bug reports, feature ideas, and the game wishlist.

## Routes

| Path | Component | Auth |
|------|-----------|------|
| `/feedback/bugs` | Bug board | Open |
| `/feedback/ideas` | Feature ideas board | Open |
| `/wishlist` | Game wishlist board | Open |
| `/feedback/new?kind=bug\|feature\|wishlist` | Submit form | Signed in (guests see sign-in prompt) |
| `/feedback/:id` | Detail thread | Open read-only; vote, watch, and comment require sign-in |
| `/feedback/mine` | User's submissions | Signed in |
| `/feedback/admin` | Admin triage | Admin |
| `/feedback/history` | Archived bugs, features, and wishlist games | Open |
| `/feedback/history/:tab` | History tab (`bugs`, `ideas`, `games`) | Open |

## Kinds

- **bug** — screenshots optional on create; up to 3 images per follow-up comment; bug context captured from error pages
- **feature** — markdown body; attachments on create and comments (up to 3 images per comment)
- **wishlist** — game title, HTTPS URL, optional cover image (one PNG/JPEG/WebP), notes; dedup by BGG id or normalized URL

## API

Open queries: `feedback_list`, `feedback_get`, `feedback_history_list`, `wishlist_search`.

Auth queries: `feedback_create`, `feedback_vote`, `feedback_comment`, `feedback_subscribe`, `feedback_update`, `feedback_set_status`, `feedback_reclassify` (admin: bug → feature, non-terminal only), `feedback_set_admin_fields`, `feedback_mine`, `feedback_admin_list`, `feedback_delete` (wishlist admin), `feedback_merge` (wishlist admin), `feedback_hold_retention` (admin).

## Retention and history

Terminal posts are archived to S3 after a configurable delay (`FEEDBACK_ARCHIVE_AFTER_TERMINAL_DAYS`, default 90). The nightly `feedback-archive` job (node-backend Lambda, `npm run feedback-archive`) writes a `HISTORY#` summary row, stamps `archivedAt` and `expiresAt` on live rows, and stores a full JSON snapshot in S3. Live DynamoDB rows are removed when `expiresAt` TTL fires (`FEEDBACK_LIVE_RETENTION_AFTER_ARCHIVE_DAYS`, default 90).

Admins can set `retentionHold` on a post to skip automatic archiving. The history board at `/feedback/history` lists archived summaries; detail pages show an archived banner and, after TTL purge, a summary-only view.

Screenshot and wishlist cover objects under `{postId}/` in the attachments bucket are deleted after live rows expire (`attachmentsPurgeAfter` on `HISTORY#` rows). JSON archive snapshots at `archive/{postId}.json` are kept. Abandoned presign uploads under `staging/` are swept after 24 hours. Wishlist admin delete and merge remove attachment objects immediately (including BGG backfill covers). Re-running the BGG cover backfill replaces the stored key and deletes the previous S3 object.

Nightly cleanup: `feedback-attachment-cleanup` Lambda (`npm run feedback-attachment-cleanup` locally), scheduled 30 minutes after the archive job.

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
