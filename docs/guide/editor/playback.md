# Playback and rendering

Choose what runs, try edits, and export audio when the piece is ready.

## Choose a target

Use the playback settings to choose the main CSD or ORC file. Opening another tab does not change that target. **Play** starts it, **Pause** pauses or resumes, and **Stop** ends the performance.

Playback uses the current source. If you own the project, starting it with the main **Play** button or the **Run** shortcut also starts a cloud save of all edited files. In a public project, those saved edits become public. Pausing or resuming does not start a save.

Check the [Console](../tools/console.md) if nothing starts or the performance stops with an error.

## Audio output and engine

Open **I/O → Audio Output** to choose speakers or headphones and play a short test sound. Some browsers offer an output picker; others need microphone permission to list devices. Browsers without output selection use the operating system's chosen output.

Under **Advanced**, choose a latency preference and sample rate for live playback. The browser decides the actual buffer size. Lower latency suits live playing; the playback preference can reduce CPU use. These settings do not change file rendering. Save them and restart playback to apply them.

The IDE checks for SharedArrayBuffer support each time you play. When the browser or embedding site cannot share memory, it uses MessageChannel audio. If shared audio fails to start, the IDE retries once with a fresh MessageChannel engine. No setting or special header is needed for that fallback.

For troubleshooting, **I/O → Disable SharedArrayBuffers** forces MessageChannel audio. Leave it unchecked for automatic selection. **View → Theme** changes the editor's colors.

## Play several pieces

Switch the project to playlist mode in playback settings, add tracks, and arrange them with the up and down controls. Choose a starting track, then press Play. The playlist advances when Csound finishes the current piece.

A piece with no end event can run forever. Stop it yourself. A playback error stops the playlist, and the play button on a playlist file's tab runs that file alone.

## Render an audio file

Open **Render**, choose the output settings, and start the render. It runs the selected target offline using the current source, without saving source edits, and adds the finished audio to the local file list. A finite score gives the render a clear end.

Offline rendering cannot use a live microphone or live MIDI. Remove those input options or use input files first. You can stop a render to cancel it.

Download the result, or use its Upload icon to save it in a project you own. [Files and saving](../projects/filesystem.md) explains the local file list.

## Change a running instrument

During playback, select orchestra code or score events and use the [evaluation shortcuts](../reference/shortcuts.md). In a CSD, select statements inside the relevant section, without its XML tags. Keep the console open while trying changes.
