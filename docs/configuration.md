# Configuration

Environment-specific settings live in [`src/config/`](../src/config/index.js). The active file is selected at build time by `REACT_APP_REAL_MODE`.

## Environment modes

| Mode | `REACT_APP_REAL_MODE` | npm script | Config file |
|------|----------------------|------------|-------------|
| Local dev | `local` | `npm start` | [`local.js`](../src/config/local.js) |
| Dev deploy | `development` | `npm run build-dev` | [`dev.js`](../src/config/dev.js) |
| Prod deploy | `production` | `npm run build-prod` | [`prod.js`](../src/config/prod.js) |

Selection logic is in [`src/config/index.js`](../src/config/index.js), which merges the environment file with [`global.js`](../src/config/global.js).

## Config keys

Each environment file exports:

| Key | Purpose |
|-----|---------|
| `COGNITO_USER_POOL_ID` | Cognito user pool |
| `COGNITO_APPID` | Cognito app client ID |
| `COGNITO_DOMAIN` | Hosted UI domain (e.g. `auth.dev.abstractplay.com`) |
| `COGNITO_COOKIE_DOMAIN` | Cookie domain (`localhost` for local; `play.dev.abstractplay.com` for dev deploy) |
| `COGNITO_REDIRECT_LOGIN` | OAuth callback URL after sign-in |
| `COGNITO_REDIRECT_LOGOUT` | Redirect URL after sign-out |
| `API_ENDPOINT` | API Gateway base URL (trailing slash) |
| `API_ENDPOINT_OPEN` | `{API_ENDPOINT}query` — public queries |
| `API_ENDPOINT_AUTH` | `{API_ENDPOINT}authQuery` — authenticated queries |
| `WS_ENDPOINT` | WebSocket API URL |
| `PUSH_API_URL` | Same as `API_ENDPOINT_AUTH` (used for `save_push`) |

From `global.js`:

| Key | Purpose |
|-----|---------|
| `PUSH_VAPID_PUBLIC_KEY` | Web Push VAPID public key for browser subscription |

## Local vs deployed

**Local** (`local.js`): `COGNITO_COOKIE_DOMAIN` is `localhost`; redirect URLs are `http://localhost:3000`. API and WS endpoints point at the dev backend stack.

**Dev deploy** (`dev.js`): Cookie domain and redirects use `play.dev.abstractplay.com`.

**Prod deploy** (`prod.js`): Cookie domain and redirects use `play.abstractplay.com`; API and WS endpoints point at the prod stack.

## Importing config

Components import from `../config` (resolved to `index.js`):

```javascript
import { API_ENDPOINT_OPEN, WS_ENDPOINT } from "../config";
```

Never hard-code endpoints in components — always use the config module.

## Cognito setup

Pool and app client must be configured in AWS to match the values in your config file. Callback and sign-out URLs must include every origin the client runs on. See [Backend deployment](/backend/deployment/) for Cognito essentials.

## Related

- [Getting started](/front/getting-started/)
- [Authentication](/front/auth/)
- [Deployment](/front/deployment/)
