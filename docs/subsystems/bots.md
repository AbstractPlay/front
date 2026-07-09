# Bots

The front end provides UI for users to register and manage bots. Bot move submission itself uses the backend bot framework (M2M auth), not the browser.

## Key files

| File | Role |
|------|------|
| [`Bots/`](../src/components/Bots/botApi.js) | Bot management components |
| [`Bots/botApi.js`](../src/components/Bots/botApi.js) | Auth API wrapper with response parsing |

## API usage

`botApi.js` wraps `callAuthApi` with `parseAuthResponse()` to handle the API Gateway `{ statusCode, body }` envelope consistently.

Typical auth queries:

| Query | Purpose |
|-------|---------|
| `create_bot` | Register a new bot |
| `delete_bot` | Remove a bot |
| `rotate_bot_secret` | Rotate Cognito client secret |
| `test_bot` | Ping the dev reference bot |

Full catalog: [Bot queries](/backend/api/bot-queries/).

## UI integration

- Bot list appears in user settings / profile areas
- Dashboard (`Me.js`) can show bot game status via `testBotStatus`
- `globalMe.bots` is populated from the `me` query

## Backend documentation

Protocol, authentication, and implementation guides live in the backend docs:

- [Bot framework](/backend/bots/)
- [Bot authentication](/backend/bots/authentication/)
- [Bot protocol](/backend/bots/protocol/)
- [Bot implementation](/backend/bots/implementation/)

## Related

- [API client](/front/api/client/)
- [Dashboard](/front/subsystems/dashboard/)
