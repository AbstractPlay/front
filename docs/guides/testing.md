# Testing

## Current state

Testing is minimal. The project uses Jest via Create React App:

```bash
npm test
```

Runs `react-scripts test` in watch mode.

### Existing tests

| File | Coverage |
|------|----------|
| [`src/pages/Skeleton.test.js`](../src/pages/Skeleton.test.js) | Smoke render of `Skeleton` |

Dependencies: `@testing-library/jest-dom`, `@testing-library/user-event`.

### Jest config

CRA overrides live in [`config/jest/babelTransform.js`](../config/jest/babelTransform.js) and [`fileTransform.js`](../config/jest/fileTransform.js). There is no `setupTests.js` in the repo today.

## Adding tests

1. Colocate tests as `Component.test.js` next to the component, or under `src/pages/` for page shells.
2. Import from `@testing-library/react` and `@testing-library/user-event`.
3. Mock heavy dependencies:
   - `aws-amplify` / `Auth` for auth flows
   - `fetch` for API calls
   - `@abstractplay/gameslib` / `@abstractplay/renderer` for game components

Example pattern:

```javascript
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

test("renders heading", () => {
  render(<MyComponent />);
  expect(screen.getByText(/expected/i)).toBeInTheDocument();
});
```

## What to prioritize

High-value test targets if expanding coverage:

- [`callAuthApi`](../src/lib/api.js) — token missing, 401 redirect
- [`botApi.js`](../src/components/Bots/botApi.js) — response envelope parsing
- Pure functions in [`src/lib/GameMove/`](../src/lib/GameMove/exploration.js) — exploration, settings
- Route smoke tests for critical pages

## Linting

ESLint config: [`.eslintrc.json`](../.eslintrc.json) (`eslint:recommended`, `react-app`, `react-hooks`).

## Related

- [Getting started](/front/getting-started/)
- [Architecture](/front/architecture/)
