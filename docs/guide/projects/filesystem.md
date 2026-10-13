# Files and saving

Keep source, samples, and generated files together without losing track of what you have saved.

## Project files

The file tree holds text files such as `.csd`, `.orc`, `.sco`, `.udo`, and `.md`, plus uploaded media and analysis files. Click a file to open it. Use the file controls to create folders, rename files, or add files from your computer.

Csound receives a virtual filesystem for the project when it runs. Use project paths in your code and keep capitalization consistent. For a sample in a folder called `samples`, a path might be `samples/kick.wav`. An include can refer to `voices/bass.udo`.

These paths belong to the project. They are not paths to your computer's Downloads folder. Upload a file before referring to it from Csound.

## Source edits and cloud saves

**Save** writes the current document to the cloud, and **Save all** writes the edited documents. Only the signed-in owner can save changes to that project.

If you own the project, starting playback with the main **Play** button or the **Run** shortcut also starts a cloud save of all edited files. Those saved edits become public if the project is public. Pausing or resuming does not start a save.

Render, a source tab's play button, and [WebMCP](../reference/webmcp.md) playback use the current source without saving edits.

A visitor can try edits locally. Save your work in your own project or download it before leaving if you want to keep those changes.

## Generated files need one more step

Rendering and the tools' **Add to project** buttons put output in the local file list. You can open it and download it straight away. Adding a result there does not upload it to cloud storage.

If you own the project, use the **Upload** icon beside the local file to keep it in the project. Wait for the upload to finish. Download the result if you want a copy on your computer. Local output can disappear when you leave the project or reload the page.

## Useful file types

| File                           | Use                                             |
| ------------------------------ | ----------------------------------------------- |
| `.csd`                         | Instruments, options, and score in one document |
| `.orc`, `.udo`                 | Orchestra code and user-defined opcodes         |
| `.sco`                         | Csound score events                             |
| `.wav`, other supported audio  | Samples and rendered sound                      |
| `.pvx`, `.ats`, `.het`, `.lpc` | Analysis data for suitable Csound opcodes       |
| `README.md`                    | The project's introduction and instructions     |

Use the [audio file preview](../editor/audio-files.md) to inspect a sample, or [README.md](readme.md) to explain the folder layout to listeners.
