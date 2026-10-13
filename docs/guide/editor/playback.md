# Playback and rendering

Choose what runs, try edits, and export audio when the piece is ready.

## Choose a target

Use the playback settings to choose the main CSD or ORC file. Opening another tab does not change that target. **Play** starts it, **Pause** pauses or resumes, and **Stop** ends the performance.

Playback uses unsaved source. Save separately when you want to keep an edit. Check the [Console](../tools/console.md) if nothing starts or the performance stops with an error.

## Play several pieces

Switch the project to playlist mode in playback settings, add tracks, and arrange them with the up and down controls. Choose a starting track, then press Play. The playlist advances when Csound finishes the current piece.

A piece with no end event can run forever. Stop it yourself. A playback error stops the playlist, and the play button on a playlist file's tab runs that file alone.

## Render an audio file

Open **Render**, choose the output settings, and start the render. It runs the selected target offline and adds the finished audio to the local file list. A finite score gives the render a clear end.

Offline rendering cannot use a live microphone or live MIDI. Remove those input options or use input files first. You can stop a render to cancel it.

Download the result, or use its Upload icon to save it in a project you own. [Files and saving](../projects/filesystem.md) explains the local file list.

## Change a running instrument

During playback, select orchestra code or score events and use the [evaluation shortcuts](../reference/shortcuts.md). In a CSD, select statements inside the relevant section, without its XML tags. Keep the console open while trying changes.
