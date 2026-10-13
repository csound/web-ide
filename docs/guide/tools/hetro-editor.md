# HETRO Editor

Inspect and edit harmonic analysis as text, then rebuild data for adsyn.

## Open an analysis

Choose a HETRO file from the project or your computer. You can also start with the built-in example. [Audio Analysis](audio-analysis.md) produces harmonic data from a recording.

The tool converts the data to editable text and plots amplitude and frequency tracks. Select a harmonic to inspect its movement.

## Edit the text

Keep the HETRO header and the required track structure. Amplitude and frequency tracks contain time-value pairs. Preserve the ordering of times and the format's terminators when you change values.

After a short pause, valid text rebuilds the binary result. An invalid edit shows an error instead of exporting a partly parsed file. The last valid plot can help you compare, but wait until your current text passes before exporting.

## Keep both forms

Download editable text if you want to work on it later. Download the binary result for use with `adsyn`, or add it to the local file list and upload it to the project.

For partial tracks stored in SDIF, use [SDIF Converter](sdif-converter.md) first.
