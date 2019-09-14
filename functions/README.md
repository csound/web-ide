## Installation
1. `npm install -g firebase-tools` (provides firebase-cli)
2. Login via google OAuth by typing `firebase login`
3. confirm that you're logged in by typing `firebase list`
4. Activate a default project from your google-appengine projects by typing `firebase use --add`.

## Useage
### Scope

```
# All functions
$ firebase deploy --only functions
```

```
# Some functions
$ firebase deploy --only functions:new_user_callback
```

When developing run `firebase serve --only functions`
When deploying run `firebase deploy --only functions`
Watch the logs from the command line with firebase functions:log


## Understanding the firebase-cli
Firebase is pretty strict on the directory structure. All cloud functions must be uploaded from one .js file from the functions directory.

## Troubleshoot
- Read the firebase-debug.log file when something crashes
- Common tip is to try `npm install -g @google-cloud/functions-emulator` for strange errors

## Online resources
- https://github.com/firebase/functions-samples
- https://firebase.google.com/docs/functions/firestore-events
