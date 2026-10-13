# Audio file preview

Inspect a sample and listen before choosing how to change it.

## Open and listen

Click an audio file in the file tree. Its preview shows a waveform with play and pause, a position marker, seeking, and volume. The browser must support the file's audio format to decode it.

Use the waveform to find a useful section or check a sound's start and end. This player auditions the file on its own, separate from the project's Csound performance.

## Read the information table

The table below the player shows the file information the reader can recover: duration, sample rate, channels, encoding, and signal measurements. Files that contain extra sampler or broadcast metadata can show more rows.

Some formats omit fields. Decoded signal statistics describe the audio the browser read, while file metadata describes the stored file. A missing value does not mean the value is zero.

## Open a tool from the sample

The buttons beside the waveform and table suggest tools for the task, such as trimming, changing sample rate, or making an analysis. They open the tool in the editor area with that sample selected.

Use [Sample Editor](../tools/sample-editor.md) for audio changes, [Audio Analysis](../tools/audio-analysis.md) for analysis data, or [Mixer](../tools/mixer.md) to combine files. Export or add the result when you are ready.
