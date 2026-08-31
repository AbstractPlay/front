# Authentication

The browser client authenticates users through **AWS Cognito** via **aws-amplify** v6. Sign-in uses the Cognito hosted UI (OAuth authorization code flow with federated identity providers).

## Configuration

Amplify is configured once at app startup in [`amplifyAuth.js`](../src/lib/amplifyAuth.js), called from [`index.js`](../src/index.js):

- User pool ID and app client ID from config
- Cookie storage (7-day expiry, secure, domain from `COGNITO_COOKIE_DOMAIN`)
- OAuth domain, scopes (`openid`, `email`, `aws.cognito.signin.user.admin`), `responseType: "code"`

Redirect URLs come from `COGNITO_REDIRECT_LOGIN` and `COGNITO_REDIRECT_LOGOUT`. See [Configuration](/front/configuration/).

[`polyfills.js`](../src/polyfills.js) imports `aws-amplify/auth/enable-oauth-listener` so OAuth callbacks complete in production Vite builds (the listener must live in the root bundle, not a lazy chunk).

## Sign-in flow

1. User clicks login → `signInWithRedirect()` via [`redirectToSignIn()`](../src/lib/amplifyAuth.js) (in [`LogInOutButton.js`](../src/components/LogInOutButton.js)).
2. Browser redirects to Cognito hosted UI.
3. On success, Cognito redirects back with an authorization code; Amplify exchanges it for tokens.
4. [`resolveAuthSession()`](../src/lib/authSession.js) stores the JWT and normalized identity fields (`userId`, `username`, `email`) in Zustand `authSession`; UI components read them via [`useAuthSession()`](../src/hooks/useAuthSession.js).

## Session bootstrap

`Skeleton` calls [`resolveAuthSession()`](../src/lib/authSession.js) on load:

- Success → marks `localStorage.wasLoggedIn = "1"`.
- Failure with prior `wasLoggedIn`, no intentional logout, and a non-anonymous route → session expired; auto-triggers `signInWithRedirect()`.

## Token refresh

[`getAuthTokenFromSession()`](../src/lib/authSession.js) returns a cached JWT while it is still valid (with a 5-minute buffer before expiry). When the token is stale or missing, it silently calls `fetchAuthSession()` again so Amplify can refresh the ID token without flashing the login UI.

[`callAuthApi`](../src/lib/api.js) retries once with a forced session refresh on HTTP 401/403 before redirecting to Cognito.

## Sign-out

[`UserSettingsModal.js`](../src/components/UserSettingsModal.js) sets `sessionStorage.intentionalLogout = "1"` before `signOut()` so the expiry handler does not immediately re-login.

## User profile (`globalMe`)

After login, [`useProfileBootstrap`](../src/hooks/useProfileBootstrap.js) calls [`fetchProfile()`](../src/lib/globalMeBootstrap.js) (`me_profile`), which populates Zustand `globalMe` (bots, settings, `activeGames`, etc.). [`Me.js`](../src/components/Me.js) calls `fetchDashboard()` (`me_dashboard`) on the `/me` page for games, challenges, and notifications.

## New user onboarding

If the backend returns an incomplete profile, [`NewProfile.js`](../src/components/NewProfile.js) prompts the user to set a display name and preferences.

## Token usage

- **Auth API calls** — `Authorization: Bearer <jwt>` via [`callAuthApi`](../src/lib/api.js)
- **WebSocket** — token sent on subscribe (see [WebSockets](/front/subsystems/websockets/))
- **Push notifications** — token sent with `save_push` (see [Notifications](/front/subsystems/notifications/))

## Profile updates

Email changes go through Amplify v6 attribute APIs (`updateUserAttribute`, `confirmUserAttribute`) in `UserSettingsModal`, not the node-backend `authQuery` layer.

## Cognito setup (ops)

Pool configuration, callback URLs, and identity providers are documented in [Backend deployment](/backend/deployment/). Dev and prod use separate pools; tokens are not interchangeable across stages.

## Related

- [API client](/front/api/client/)
- [Configuration](/front/configuration/)
- [Dashboard](/front/subsystems/dashboard/)
