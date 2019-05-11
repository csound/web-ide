# Developer Documentation

<!-- SERVER -->

## Server(Firebase)

### Overview

* Firebase Authentication: user identity 
* Firebase Database: Cloud Firestore or Realtime Database?
* Firebase Storage: for storage of binaries (ogg, wav, mp3)
* Firebase Hosting: for hosting the site

### Data

* Projects have files and directories
* Files may be textual: CSD, ORC, TXT, MD (, HTML, JS)
* Resources: OGG, MP3, WAV



### URL Structure

* /[user-id]/[project-name]
* /[user-id]/[project-name]/edit
* /[user-id]/[project-name]/[file-name]  
* /[user-id]/[collections]/[project-name]



<!-- CLIENT -->

## Client

### Technologies

* npm/yarn
* React
* Redux
* Firebase
* Csound


### Coding Practice

### Features  

* IDE-like with project file tree on left (see Codepen.io Projects)
* Client-side code: user selects a file in file tree, we have mime-type like system to identify type, open editor for type (text editor with different hilighting, playback interface for auditioning audio files)
* Project can have "main" CSD file set
* Project can have multiple CSD files (maybe one for realtime, one for disk, etc.).  See csound-live-code project for example.
* User can render to "disk" which will render to local filesystem. This will need to render to Emscripten FS, which is also where we will be mapping our project files to in memory. We should consider having a local area mapped to a separate peer folder to the project folder that user can render to so that and output render doesn't get added to project and synced back to firebase.


<!-- Milestone -->

### Milestone 1

* User can start a new project
* User can name project (must be unique)
* User can add .orc file
* User can add .sco file
* User can add .csd file
* User can use \#include and files include correctly
* User can start rendering with CSD
* User can eval to live code
* User can save project (or just have auto-save)
* User can mark project public/private

### Milestone 2
* User can clone project
* User can fork project (with history)



### Desktop
* Electron application
* Look at NPM packaging for WebCsound? (is this necessary?)
* Another option is Progressive Web App (PWA)



## Brainstorming

* Loading .orc from external URL would be very handy (see Codepen, jsfiddle, etc.)
