# LPC Editor

Inspect linear-prediction analysis and edit complete frames as text.

## Open or try an example

Choose an LPC analysis from the project or your computer. The built-in example is useful for learning the text format. Voice mode in [Audio Analysis](audio-analysis.md) can create LPC data from a recording.

## Read the text

The header describes the representation, pole count, values per frame, frame rate, sample rate, and duration. Each frame then contains residual RMS, source RMS, error, pitch, and filter data.

Keep the header and label rows. The editor supports coefficient data and pole-pair data, which need different frame widths. Changing the pole count alone is not enough: each frame must still match it.

## Edit and check

The preview follows valid edits after a short pause. Errors identify invalid rows or dimensions. This editor's text keeps full frames and extra header bytes, so retain those fields when moving text between files.

Download the text or rebuilt `.lpc` output, or add the output to the local file list. Use an LPC resynthesis instrument to hear it. Changing filter data can change the sound sharply, so start playback at a low level.
