# Local Testing Setup

This guide explains how to run a local copy of the web IDE connected to your own Firebase project, so you can test UI/UX flows, including account deletion, against a real database.

## Username repair

New accounts use their user ID as a username until they choose a name. The auth
trigger creates the profile and username lookup in one transaction and preserves
any name the user has already chosen. Signup still asks users with a fallback
name to choose one. Profile edits keep the user-ID lookup so shared fallback
links continue to work.

From the repo root, audit profiles without changing data:

```bash
./functions/node_modules/.bin/tsx functions/scripts/repair-usernames.ts \
  --project csound-ide --report /tmp/username-audit.json --firebase-login
```

Add `--apply` to repair the listed profiles. The tool restores an existing
registered name where possible, otherwise uses the user ID. It also creates
missing lookup entries. It checks each profile again in a transaction, preserves
other fields, and reports conflicting or ambiguous names without changing them.
Each run saves the old username and repair result in the report. Keep that report
outside Git. Rerunning the tool skips profiles that already have valid lookups.

`--firebase-login` uses the Firebase CLI account already signed in on this
machine. Omit it to use Google application default credentials.

## Popular project counts: first rollout

`popular_projects` reads public projects ordered by `starCount`, with a limit
of 50. It uses fresh queries so privacy changes and deletions take effect on
the next request. `toggle_project_star` uses the signed-in user's ID and commits
the star, the user's starred-project list, and the project count in one
transaction. It computes the total from the current star record.

`project_stars_counter` also handles writes from older browser tabs. That
trigger re-reads the current documents in a transaction, so duplicate or late
events cannot restore an old count. Older tabs still have the trigger's delay;
the new client waits for the count to commit with the star.

Before merging this change into a branch that deploys automatically, prepare
each Firebase project in this order:

1. Build the functions and deploy only `toggle_project_star` and
   `project_stars_counter` from this branch. Keep the current ranking endpoint
   and frontend in place for now.
2. Create the index below and wait for it to finish building. This command adds
   one index without replacing existing indexes.
3. Audit existing counts with the backfill script, then run it with `--apply`.
   Re-run the audit and check that it reports zero changed projects.
4. Deploy `popular_projects` and the frontend together with the rest of this PR.

Create the index for the selected project:

```bash
gcloud firestore indexes composite create --project=PROJECT_ID \
  --collection-group=projects --query-scope=collection \
  --field-config=field-path=public,order=ascending \
  --field-config=field-path=starCount,order=descending \
  --field-config=field-path=__name__,order=ascending
```

From the repo root, using Google application default credentials:

```bash
./functions/node_modules/.bin/tsx functions/scripts/backfill-star-counts.ts \
  --project PROJECT_ID > /tmp/star-count-audit.jsonl

./functions/node_modules/.bin/tsx functions/scripts/backfill-star-counts.ts \
  --project PROJECT_ID --apply > /tmp/star-count-backfill.jsonl
```

The script defaults to read-only mode. It walks projects in pages of 100 and
re-reads each project and its stars in a transaction before changing only
`starCount`. It skips deleted projects and supports reruns. Keep its reports
outside Git. Projects without a count do not appear in the new ranking, so the
backfill must finish before the new endpoint goes live.

See [Firestore write-time counts](https://firebase.google.com/docs/firestore/solutions/aggregation)
and the [index command reference](https://docs.cloud.google.com/sdk/gcloud/reference/firestore/indexes/composite/create).

## Prerequisites

```bash
npm install -g firebase-tools
firebase login
```

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and create a new project
2. Enable **Authentication** → Sign-in method → Google
3. Enable **Firestore Database** (start in test mode)
4. Enable **Storage** (start in test mode)

## 2. Link the project locally

```bash
firebase use --add
# Select your newly created project and give it an alias, e.g. "local"
```

## 3. Install dependencies

```bash
# Root (frontend)
npm install

# Functions
cd functions && npm install && cd ..
```

## 4. Configure environment

Copy the Firebase web app config from your project's console (**Project Settings → Your apps → SDK setup**) into `src/config/firestore.ts`, replacing the existing credentials.

Set the Storage bucket URL so the `project_file_storage_delete_callback` function targets the right bucket:

```bash
# functions/.env (create if it doesn't exist)
STORAGE_BUCKET_URL=<your-project-id>.appspot.com
```

### Search server (optional)

The search server (`search/`) connects to Firestore directly using Admin SDK service account keys. These are **not committed to the repo**. To enable it:

1. Go to Firebase Console → **Project Settings → Service accounts → Generate new private key**
2. Save the downloaded JSON files as:
    - `search/service-key-dev.json`
    - `search/service-key-prod.json`
3. Uncomment the code in `search/firebase.ts`

> The search server is not required for UI/UX testing — the frontend search calls go through the deployed `search_projects` function instead. Skip this unless you need to run the standalone search server.

## 5. Deploy functions

> **Blaze plan required.** Cloud Functions deployment requires the Firebase Blaze (pay-as-you-go) plan. Upgrade your test project at:
> `https://console.firebase.google.com/project/<your-project-id>/usage/details`
> There is no charge unless you exceed the free-tier limits, which is unlikely for local testing.

The local frontend still calls production-style callable functions, so deploy them to your test project first:

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 6. Start the frontend

```bash
# From the repo root
npm run dev
```

The app will be available at <http://localhost:3000>.

## Understanding the firebase-cli

Firebase is pretty strict on the directory structure. All cloud functions must be uploaded from one .js file from the functions directory.

## Troubleshoot

- Read the firebase-debug.log file when something crashes
- Common tip is to try `npm install -g @google-cloud/functions-emulator` for strange errors

## Online resources

- https://github.com/firebase/functions-samples
- https://firebase.google.com/docs/functions/firestore-events

## Dev deploy recovery

The `Deploy Develop` workflow uses the Firebase CLI pinned in this directory and
one `GCP_SA_KEY_DEV` login for deployment and access checks. A concurrency group
allows only one dev deploy at a time and lets an active deploy finish.

Before building, `node scripts/deploy-dev.mjs --preflight` checks the deployment
identity's function deployment, Cloud Run read, and Cloud Run IAM permissions.
The dev CI account is `csound-ide-dev@appspot.gserviceaccount.com`. In addition to
its existing roles, it has the dev-only custom role
`projects/csound-ide-dev/roles/csoundBrowserAccessManager`, which contains:

- `run.services.getIamPolicy`
- `run.services.setIamPolicy`

These permissions let the shared access script maintain `roles/run.invoker` for
`allUsers` only on the browser endpoints listed in `scripts/callable-access.json`.
The script validates function types before writing IAM and preserves other grants.
IAM permissions belong to the service account; replacing its key does not add them.

The deploy script compares the checkout with the latest successful dev workflow
run that is its Git ancestor. Backend or deployment-config changes select all
functions because they share one source bundle. Other changes select `host`,
which serves the built app shell. Missing or unhealthy functions are always
included. Without a usable baseline, it deploys all declared functions.

It deploys named functions in batches of two, then checks each batch before
starting the next. Named targets also bypass the CLI's unchanged-function skip.
Quota and transient failures get three retries after 60, 120, and 240 seconds.
Permission errors and ordinary startup errors fail without retries. Removed
exports require a separate, explicit function deletion; batches do not delete
unrelated functions.

An `ACTIVE` function alone does not prove that its latest Cloud Run revision
started. The readiness check requires Cloud Run's `Ready` condition and matching
latest-created/latest-ready revisions. Hosting publishes only after every declared
function is ready and browser-access checks pass. Browser checks run again after
publication. Each readiness check shares one three-retry allowance across all
polls, with at most two minutes of polling and seven minutes of retry delays.
For the current 16 functions, all eight batches and the final readiness check
can wait at most 137 minutes in total. The job allows 240 minutes, leaving time
for installs, builds, API calls, and Hosting publication.

To repair failed revisions locally, first build the frontend and functions and
run `npm run prepare:deploy:dev`. With valid Firebase/Google credentials, run:

```bash
node scripts/deploy-dev.mjs --preflight
node scripts/deploy-dev.mjs --repair
npm run access -- --env dev --apply
./functions/node_modules/.bin/firebase deploy -P develop --config firebase.dev.generated.json --only hosting --non-interactive
npm run access -- --env dev --check
```

`--repair` selects only missing or unhealthy functions. `--check` checks readiness
without deploying. Publish the matching Hosting build when repairing `host`, so
its app shell references assets present on Hosting. A saved account in
`gcloud auth list` does not guarantee a valid login; refresh it with
`gcloud auth login` if API calls report `invalid_grant`.
