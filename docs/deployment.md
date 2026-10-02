# Deployment guide for maintainers

## Firebase Web Hosting

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

### Enable retries once before unattended dev deploys

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
