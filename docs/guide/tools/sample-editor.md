# Sample Editor

Trim a recording, set its level, or prepare it for another sample rate.

## Choose the source

Select a project audio file or open one from your computer. You can also enter from the [audio file preview](../editor/audio-files.md). Listen and seek on the waveform before making changes.

## Make changes

Choose an operation and adjust its controls. The editor waits briefly after an edit, then rebuilds the result. There is no Apply button. Repeating a setting does not repeatedly process the previous result: the current change list determines what happens to the source.

| Operation    | Use                                                     |
| ------------ | ------------------------------------------------------- |
| Trim         | Drag a range across the waveform to choose what to keep |
| Gain         | Raise or lower the whole file's level                   |
| Normalize    | Set the peak level while keeping the dynamics           |
| Resample     | Change the sample rate                                  |
| Reduce noise | Select a noise-only range of at least 0.1 seconds       |

## Review and reset

The player auditions the current processed result. The changes list shows what is active. Remove one change with its X or reset that effect to its default. **Clear all changes** returns to the source.

While processing, wait for the tool's loading indicator to finish before judging the result. If you need to compare with the unchanged file, open its audio preview in another tab.

## Keep the audio

Download the result or add it to the local project file list. The source file stays intact. Upload the generated file from the tree if you want it saved in the cloud. See [Files and saving](../projects/filesystem.md).
