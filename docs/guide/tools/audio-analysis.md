# Audio Analysis

Turn a recording into data for Csound's spectral and resynthesis opcodes.

## Choose an analysis

Select an audio file and choose the method that fits the sound you want to make.

| Mode      | Result                  | Intended use                    |
| --------- | ----------------------- | ------------------------------- |
| Spectrum  | PVOC-EX `.pvx`          | Phase-vocoder processing        |
| Partials  | ATS `.ats`              | Tracking individual tones       |
| Harmonics | HETRO data              | Additive resynthesis with adsyn |
| Voice     | LPC data                | Speech and formant work         |
| Envelope  | Time and amplitude text | Following changes in level      |

## Set the range and controls

Choose the part of the audio to analyze and the input channel where offered. Spectrum exposes an FFT size. Harmonic analysis needs a plausible fundamental frequency and harmonic count. Voice analysis has its own prediction settings.

The tool reruns after a short pause when you change a control. Its loading indicator shows work in progress, and the changes list lets you remove a setting or reset all changes.

## Understand the preview

The plots show the resulting analysis. The audio player lets you audition the source range used for it. It is not a resynthesis of the exported analysis data.

Download the output or add it to the local file list. Use the matching Csound opcodes to turn analysis data back into sound. For text edits, continue in the [PVX Editor](pvx-editor.md), [HETRO Editor](hetro-editor.md), or [LPC Editor](lpc-editor.md).
