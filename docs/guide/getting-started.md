# Getting started

Write, play, and share Csound music in your browser.

## Hear a project

Open a public project from the home page and press **Play**. You can listen and try changes without an account. If the author included a README, read it first: some pieces need a MIDI keyboard, a microphone, or a particular file selected for playback.

The main play button runs the selected target. Clicking a source tab only opens the file. See [Playback and rendering](editor/playback.md) if a project has several pieces.

## Make it yours

You can sign in with email and password, Google, GitHub, or Facebook. If you already have an account, sign in with your usual method first. Open **Edit profile** on your profile page and choose **Connect GitHub** to add GitHub sign-in to that account and keep your projects together. The connection saves right away.

Sign in, choose a username, and open **My projects** from the header. Create a project there, give it a name, and choose a starter:

- **Single CSD** puts instruments and score in one file. Press Play to hear a short synth phrase.
- **CSD + ORC + SCO** separates the instruments and score. Run `project.csd`; it includes the other two files.
- **MIDI instrument** gives you a synth to play with the [Virtual MIDI Keyboard](tools/midi-keyboard.md) or a controller. Press Play before sending notes.
- **Live audio processing** filters your microphone or audio input. Use headphones at low volume, press Play, and allow microphone access.
- **Empty** creates a blank `project.csd` for your own code.

The MIDI and live audio starters keep running until you press Stop. Each starter is a copy you can edit freely. Add more files through the file menu or file tree.

Use **Save** to keep source edits. Starting your project with the main **Play** button also starts a cloud save of all edited files. See [Files and saving](projects/filesystem.md) for details. Changes you make in someone else's project stay local unless you make your own copy. Keep a download of work you want to preserve.

## Find your way around

The file tree holds the project's source and media. Files open in editor tabs. Tools can sit beside the editor or below it, and **More** holds the tool buttons that do not fit on screen.

Start with the [Console](tools/console.md) for errors and the [Csound Manual](tools/manual.md) for opcode help. The [tool index](tools/index.md) helps you choose a tool by task.

## Leave instructions for the next listener

Add [README.md](projects/readme.md) with a short description, steps to play, and any controls the listener needs. Visitors see it when they open your project.

## Ask for help

Post a question on the [Csound forum](https://forum.csound.com), or report a fault in the [Web-IDE issue tracker](https://github.com/csound/web-ide/issues). Include your browser, the steps that failed, and a public project link when you can.
