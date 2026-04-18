# Csound IDE — Puppeteer E2E Tests

End-to-end tests for the [Csound Web IDE](https://ide.csound.com) using [Puppeteer](https://pptr.dev) and Node's built-in test runner (`node:test`).

## Quick Start

```bash
cd puppeteer-tests
npm install
npm test            # runs against prod (ide.csound.com)
```

Puppeteer bundles its own Chromium — no browser setup needed.

## Targeting Environments

```bash
npm test              # prod (default)
npm run test:dev      # csound-ide-dev.web.app
npm run test:prod     # ide.csound.com
npm run test:local    # localhost:3000
```

Or directly: `TARGET=dev npm test`

Targets are defined in [`utils/config.js`](utils/config.js):

| Target  | URL                              |
| ------- | -------------------------------- |
| `local` | `http://localhost:3000`          |
| `dev`   | `https://csound-ide-dev.web.app` |
| `prod`  | `https://ide.csound.com`         |

## Project Structure

```text
├── tests/
│   ├── home.js              ← / route: page load, rendered content
│   └── editor.js            ← /editor/:id route: editor mount, run, console output
├── templates/
│   └── example.js           ← starter template for new test files
├── utils/
│   ├── browser.js           ← Navigation + editor/console DOM helpers
│   ├── config.js            ← target environment map, timeouts, browser settings
│   └── session.js           ← shared browser session lifecycle
├── .github/workflows/
│   ├── e2e-dev.yml          ← push to develop, TARGET=dev
│   ├── e2e-prod.yml         ← push to main, TARGET=prod
│   └── e2e-local.yml        ← pull_request + manual dispatch, TARGET=local
├── eslint.config.js
└── package.json
```

Test files are organised by route — one file per page/route under test.

## Writing a New Test

1. Copy `templates/example.js` into `tests/` and rename it to match your route (e.g. `tests/profile.js`).
2. Update the `describe` label and the `goto(page, '/your-route')` path.
3. Write `it(...)` blocks using assertions from `node:assert/strict`.
4. Run `npm test` — new files are auto-discovered, no registration needed.

### Available Helpers

`utils/browser.js`

| Helper                       | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `goto(page, path)`           | Navigate to a route on the target's base URL  |
| `gotoProject(page)`          | Navigate to the target's test project editor  |
| `waitForEditor(page)`        | Wait for CodeMirror 6 (`.cm-editor`) to mount |
| `findRunButton(page)`        | Locate the run/play button                    |
| `activateConsoleTab(page)`   | Click the Console/Output tab                  |
| `waitForConsoleOutput(page)` | Wait for non-empty console output             |

`utils/session.js`

| Helper           | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `getSession()`   | Acquire shared Chromium and create a fresh page       |
| `closeSession()` | Release one suite's session and close browser if last |

### Common Assertion Patterns

```js
import assert from "node:assert/strict";

// Check a value is truthy
assert.ok(value, "message if it fails");

// Check strict equality
assert.equal(actual, expected);

// Check a string contains a substring
assert.ok(text.includes("word"), 'Should contain "word"');

// Check an element exists after waiting for it
const el = await page.waitForSelector(".my-class", { timeout: 5000 });
assert.ok(el, ".my-class not found");

// Read text from an element
const text = await page.$eval(".my-class", (el) => el.textContent);
assert.ok(text.length > 0, "Element should have text");

// Run JS in the browser context
const result = await page.evaluate(() => document.title);
assert.equal(result, "Expected Title");
```

### Test Lifecycle

Each test file follows this pattern:

```js
import { describe, it, before, after } from "node:test";
import { goto } from "../utils/browser.js";
import { getSession, closeSession } from "../utils/session.js";

describe("RouteName [${targetName}]", () => {
    let page;

    before(async () => {
        ({ page } = await getSession());
        await goto(page, "/your-route");
    });

    after(async () => {
        await page?.close();
        await closeSession();
    });

    it("does something", async () => {
        /* assertions */
    });
});
```

`before` runs once before all tests in the suite. `after` closes the page and releases the shared browser session.

## CI

GitHub Actions runs E2E tests with three dedicated workflows:

- `e2e-dev.yml`: runs on push to `develop` with `TARGET=dev`
- `e2e-prod.yml`: runs on push to `main` with `TARGET=prod`
- `e2e-local.yml`: runs on pull requests (opened/synchronize/reopened) and manual dispatch with `TARGET=local`

See [`.github/workflows/e2e-dev.yml`](../.github/workflows/e2e-dev.yml), [`.github/workflows/e2e-prod.yml`](../.github/workflows/e2e-prod.yml), and [`.github/workflows/e2e-local.yml`](../.github/workflows/e2e-local.yml).

## Debugging

```bash
HEADLESS=false npm test
```

Opens a visible browser window so you can see what the tests interact with.

## Code Quality

```bash
npm run lint        # check
npm run lint:fix    # auto-fix
npm run format      # prettier
```
