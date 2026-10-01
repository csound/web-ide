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
