# Csound Web IDE

![Csound Web IDE logo](https://raw.githubusercontent.com/csound/web-ide/refs/heads/develop/public/favicon.ico)

> A browser-based IDE for the Csound audio programming language — write, run, and share Csound
> projects entirely in the browser, or install it as a native desktop app via Electron.

[![CI](https://github.com/csound/web-ide/actions/workflows/ci-test.yaml/badge.svg)](https://github.com/csound/web-ide/actions/workflows/ci-test.yaml)
[![License: LGPL-2.1](https://img.shields.io/badge/license-LGPL--2.1-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-ide.csound.com-brightgreen)](https://ide.csound.com)

![Csound Web IDE — project editor](https://raw.githubusercontent.com/csound/web-ide/refs/heads/develop/public/img/project_editor.png)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Overview

<!-- #overview -->

[Csound](https://csound.com) is a sound and music computing system with a long history in computer
music. Csound Web IDE brings Csound into the browser: projects are stored in the cloud, the audio
engine runs via WebAssembly, and collaboration happens through shareable project URLs — no local
installation required. The architecture in one line: **WebAssembly Csound engine + React frontend +
Firebase backend**.

---

## Features

<!-- #features -->

- Real-time Csound audio synthesis executed in-browser via a WebAssembly engine
- Syntax-highlighted code editor (CodeMirror 6 with a dedicated Csound language plugin)
- Multi-file project tree — CSD, ORC, SCO, UDO, and binary audio assets in one place
- Cloud persistence — projects saved to Firestore and audio files to Firebase Storage
- User profiles with followers, project discovery, and public/private project visibility
- Shareable editor URLs with injected Open Graph metadata for social previews
- Built-in Csound manual viewer accessible directly from the IDE
- Optional Electron desktop app for offline use without a browser

---

## Prerequisites

<!-- #prerequisites -->

| Tool         | Required   | Notes                                                |
| ------------ | ---------- | ---------------------------------------------------- |
| Node.js      | 24.x       | Local builds and CI use the version in `.nvmrc`       |
| npm          | >= 11      | Bundled with Node 24                                  |
| Firebase CLI | Optional   | Required for local Functions emulation and deployment |
| Electron     | Optional   | Required for desktop builds only                     |

Install the Firebase CLI globally when needed:

```bash
npm install -g firebase-tools
firebase login
```

NixOS users: a development shell with Electron patched for NixOS is provided in `shell.nix`.

---

## Getting Started

<!-- #getting-started -->

1. **Clone the repository**

    ```bash
    git clone https://github.com/csound/web-ide.git
    cd web-ide
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Configure environment variables**

    Create a `.env` file in the project root (see [Environment Variables](#environment-variables)
    for all keys). A minimal example:

    ```env
    REACT_APP_DATABASE=DEV

    VITE_FIREBASE_API_KEY=your-api-key
    VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
    VITE_FIREBASE_PROJECT_ID=your-project-id
    VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
    VITE_FIREBASE_APP_ID=1:000000000000:web:abc123
    ```

4. **Start the development server**

    ```bash
    npm run start
    ```

    The app opens automatically at `http://localhost:3000`.

---

## Available Scripts

<!-- #available-scripts -->

| Script                 | What it does                                    | When to use it                    |
| ---------------------- | ----------------------------------------------- | --------------------------------- |
| `npm run start`        | Vite dev server targeting DEV Firebase          | Day-to-day local development      |
| `npm run start:prod`   | Vite dev server targeting PROD Firebase         | Testing against production data   |
| `npm run build`        | Type-check + production Vite build (PROD)       | Creating a release artifact       |
| `npm run build:dev`    | Type-check + Vite build (DEV)                   | Staging / preview deploys         |
| `npm run test`         | Vitest in watch mode                            | TDD / local test iteration        |
| `npm run test:ci`      | Vitest single run (no watch)                    | CI pipelines                      |
| `npm run lint`         | ESLint with zero-warnings policy                | Pre-commit / CI quality gate      |
| `npm run lint:fix`     | ESLint with auto-fix                            | Cleaning up lint issues quickly   |
| `npm run format`       | Prettier write across `src/`                    | Auto-formatting source files      |
| `npm run format:check` | Prettier check (no write)                       | CI formatting gate                |
| `npm run typecheck`    | `tsc --noEmit` strict type check                | Validating types without building |
| `npm run electron:dev` | Launches Electron against the local dev server  | Desktop app development           |
| `npm run deploy`       | Firebase deploy to default (production) project | Production release                |
| `npm run deploy:dev`   | Firebase deploy to develop project              | Staging release                   |

---

## Environment Variables

<!-- #environment-variables -->

| Variable                            | Required | Description                                           | Example                          |
| ----------------------------------- | -------- | ----------------------------------------------------- | -------------------------------- |
| `REACT_APP_DATABASE`                | Yes      | Selects Firebase project config (`DEV` or `PROD`)     | `DEV`                            |
| `FIREBASE_TOKEN`                    | CI only  | Pre-authenticated Firebase token for headless deploys | —                                |
| `VITE_FIREBASE_API_KEY`             | Yes      | Firebase web API key                                  | `AIzaSy...`                      |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Yes      | Firebase Auth domain                                  | `project.firebaseapp.com`        |
| `VITE_FIREBASE_DATABASE_URL`        | Yes      | Realtime Database URL                                 | `https://project.firebaseio.com` |
| `VITE_FIREBASE_PROJECT_ID`          | Yes      | Firebase project identifier                           | `csound-ide`                     |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Yes      | Cloud Storage bucket                                  | `project.appspot.com`            |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes      | FCM sender ID                                         | `123456789`                      |
| `VITE_FIREBASE_APP_ID`              | Yes      | Firebase App ID                                       | `1:123:web:abc`                  |

The Firebase credentials for the DEV project are embedded in source for local development
convenience (public/read-only project). For production, supply real credentials via environment
variables and CI secrets.

Cloud Functions use a separate `functions/.env` file; see `functions/.env.example` for the
required `STORAGE_BUCKET_URL` key.

---

## Project Structure

<!-- #project-structure -->

```text
web-ide/
├── src/                  # React application source (TypeScript)
│   ├── components/       # Feature and UI components (editor, projects, profile, …)
│   ├── config/           # Firebase client initialisation
│   ├── db/               # Firestore collection references and types
│   ├── elements/         # Shared UI primitives (icons, MIDI piano, scrollbar)
│   ├── store/            # Redux store, slices, and root reducer
│   └── styles/           # Emotion themes and global styles
├── functions/            # Firebase Cloud Functions (TypeScript, Node 22)
│   └── src/              # Function handlers (auth, search, counters, SSR host)
├── public/               # Static assets and Electron entry point
├── config/               # Legacy webpack/build helpers (unused in Vite flow)
├── docs/                 # Developer notes and architecture documentation
├── scripts/              # Utility build scripts
├── search/               # Experimental standalone search service (inactive)
├── .github/workflows/    # CI/CD pipelines (lint, test, deploy)
├── firebase.json         # Firebase Hosting and Functions configuration
├── vite.config.ts        # Vite build configuration
└── tsconfig.json         # TypeScript compiler settings
```

---

## Architecture Overview

<!-- #architecture-overview -->

The frontend is a single-page application built with Vite and React 18. Redux Toolkit manages all
shared application state — auth session, open projects, editor documents, and playback status.
The code editor uses CodeMirror 6 with `@hlolli/codemirror-lang-csound` for Csound-specific
syntax highlighting and opcode completion. Audio execution is handled by `@csound/browser`, a
WebAssembly build of the Csound engine; it can optionally run inside a Web Worker when
`SharedArrayBuffer` is available (the `/editor/**` route sets the required `COEP` / `COOP`
security headers). Firebase provides authentication, Firestore stores project metadata and file
references, and Cloud Storage holds binary audio assets. A dedicated Firebase Cloud Function
(`host`) serves the SPA and injects Open Graph metadata into HTML responses for social media
crawlers. An Electron wrapper (`public/electron.js`) reuses the same Vite build to deliver an
offline-capable desktop app.

---

## Deployment

<!-- #deployment -->

### Firebase Web Hosting

Deployments are automated by GitHub Actions:

- Pushes to `develop` → DEV Firebase project (`csound-ide-dev`)
- Pushes to `master` → PROD Firebase project (`csound-ide`)

Both pipelines run lint, type-check, and format checks before deploying. Builds and CI use
Node 24. Cloud Functions use Node 22 because the auth triggers still use first-generation
Functions, which [do not support Node 24](https://docs.cloud.google.com/functions/docs/runtime-support).

Dev still deploys Functions and Hosting. Its deploy script asks the Functions SDK for a fresh
manifest, removes the empty Extensions list, and copies the Functions source into `.firebase/`.
This avoids a Firebase CLI billing check for Extensions that this app does not use. The script
fails if it finds any actual Extension declarations. Production uses the original Functions
source and its normal discovery process.

Build the app and Functions before a manual dev deploy. Run `npm run test:deploy:dev` after
installing the Functions dependencies and building them to check that dev keeps all function
definitions and Hosting routes.

#### Enable retries once before unattended dev deploys

Dev CI uses `--non-interactive` without `--force`. When a function first enables retries,
Firebase requires confirmation. CI stops until a maintainer approves that change in an
interactive terminal. Once the deployed retry policy matches the source, later deploys
need no retry confirmation.

For `new_user_callback`, wait until the database backup is complete and verified. Then,
from the repository root, build and prepare the dev source and deploy only that function:

```bash
npm ci
npm ci --prefix functions
npm run build:dev
npm run build --prefix functions
npm run prepare:deploy:dev
./functions/node_modules/.bin/firebase deploy \
    --project csound-ide-dev \
    --config firebase.dev.generated.json \
    --only functions:new_user_callback
```

Use a terminal signed into Firebase. Review the retry warning and deployment prompts before
confirming, then rerun the failed **Deploy Develop** workflow. The command above is a live
deployment, not a validation step. It does not deploy Hosting or the other functions.

Keep `--force` out of routine CI: it also accepts function deletion, unsafe trigger changes,
and some cost increases. See [Firebase's deployment confirmation checks](https://github.com/firebase/firebase-tools/blob/v15.19.1/src/deploy/functions/prompts.ts).

To deploy manually, set `FIREBASE_TOKEN` (obtain via `firebase login:ci`) and run:

```bash
# Production
npm run deploy

# Staging / develop
npm run deploy:dev
```

The build step copies `dist/index.html` into `functions/dist/` so the `host` Cloud Function
can perform server-side Open Graph injection. This step runs automatically as part of the
CI deploy workflows.

### Electron Desktop App

Start a local development session with Electron:

```bash
npm run electron:dev
```

This command launches the Vite dev server and opens an Electron window once the server is
ready on port 3000. For packaging a distributable, use `electron-builder` (already listed as
a dev dependency); refer to its documentation for platform-specific build targets.

---

## Contributing

<!-- #contributing -->

Contributions are welcome. The default branch is `develop` — all pull requests should target
`develop`, not `master`.

### Workflow

1. Fork the repository and create a branch from `develop`.
2. Make focused, well-scoped changes.
3. Commit your work. A Husky pre-commit hook automatically runs `lint`, `typecheck`, and
   `format:check` — fix any failures before pushing.
4. Open a pull request against `develop` with a clear description of the change.

### Pull request checklist

- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run typecheck` passes
- [ ] `npm run format:check` passes
- [ ] `npm run test:ci` passes
- [ ] New behaviour is covered by tests where applicable

Browse open issues and feature requests on the
[Issues tab](https://github.com/csound/web-ide/issues).

---

## License

<!-- #license -->

Distributed under the [GNU Lesser General Public License v2.1](LICENSE).

---

## Acknowledgements

<!-- #acknowledgements -->

Csound Web IDE is built on the work of the global [Csound community](https://csound.com) —
composers, researchers, and developers who have maintained and extended Csound for over three
decades.

## WebMCP

Browser agents can read and edit Csound source, switch tabs, choose targets, play,
stop, render, and read the console through 16 WebMCP tools. Click **WebMCP ready**
in an open project for setup and the tool guide, or read [WebMCP usage](docs/webmcp.md).
