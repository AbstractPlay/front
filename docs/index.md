# Front End

The Abstract Play browser client is a React single-page application (SPA) deployed to S3 and CloudFront. It is the primary interface for playing games, managing challenges and tournaments, and configuring board themes.

## Stack

| Layer | Technology |
|-------|------------|
| UI | React 18, Bulma CSS |
| Build | Create React App (`react-scripts`) |
| Routing | React Router v6 |
| State | Zustand |
| Auth | AWS Amplify + Cognito OAuth |
| Games | `@abstractplay/gameslib`, `@abstractplay/renderer` |
| Deploy | Serverless Framework + `serverless-finch` |

## Documentation

### Core

- [Architecture](/front/architecture/) — app shell, routing, state, dependencies
- [Getting started](/front/getting-started/) — clone, install, local dev
- [Configuration](/front/configuration/) — environment modes and endpoints
- [Deployment](/front/deployment/) — CI/CD, S3, CloudFront
- [API client](/front/api/client/) — how the client calls the backend
- [Authentication](/front/auth/) — Cognito, tokens, session handling

### Subsystems

- [Game move](/front/subsystems/game-move/) — live game UI and move submission
- [Dashboard](/front/subsystems/dashboard/) — home page, my-turn tables
- [Explore](/front/subsystems/explore/) — game catalog
- [Challenges](/front/subsystems/challenges/) — standing challenges
- [Tournaments](/front/subsystems/tournaments/)
- [Events](/front/subsystems/events/)
- [Lab](/front/subsystems/lab/) — offline sandbox
- [Bots](/front/subsystems/bots/) — bot management UI
- [WebSockets](/front/subsystems/websockets/) — real-time presence and updates
- [Notifications](/front/subsystems/notifications/) — web push
- [Customize & themes](/front/subsystems/customize/)
- [Internationalization](/front/subsystems/i18n/)

### Guides

- [Project structure](/front/guides/project-structure/)
- [Routing](/front/guides/routing/)
- [Styling](/front/guides/styling/)
- [Testing](/front/guides/testing/)

## Related documentation

- [Backend](/backend/) — API, DynamoDB, bot framework
- [Gameslib](/gameslib/) — game rules engine
- [Renderer](/renderer/) — board JSON and SVG rendering
- [Recranks](/recranks/) — game records and ratings

## Resources

- [GitHub repository](https://github.com/AbstractPlay/front)
- [CHANGELOG](../CHANGELOG.md) — release history (repo root)
- [Discord #dev-curious](https://discord.abstractplay.com)
- Dev site: [play.dev.abstractplay.com](https://play.dev.abstractplay.com)
- Prod site: [play.abstractplay.com](https://play.abstractplay.com)

When you add a route, API call pattern, or subsystem, update `/docs` in the same PR.

*Last verified against `develop` branch.*
