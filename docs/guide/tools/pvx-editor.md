# PVX Editor

Read phase-vocoder analysis as editable text and rebuild a PVX file.

## Start with a PVX file

Open `.pvx` analysis from the project or your computer, or try the example. To make an analysis from audio, use the Spectrum mode in [Audio Analysis](audio-analysis.md).

The editor shows text alongside a spectrum of the current valid data. Choose a frame and channel to inspect them.

## Edit a frame

Keep the header and the declared dimensions consistent. Each frame has the number of values required by the analysis layout. Make small changes first and use the preview to check which bin or frame you changed.

The converter validates edits after a pause. Errors point to the problem in the text. Export becomes available for a valid result, so an unfinished row does not silently become a damaged analysis.

## Export and listen in Csound

Download the text for later edits or the rebuilt PVX for a suitable phase-vocoder opcode. Add the PVX result to the local file list if you want to use it in this session.

The spectrum is a visual check, not a player for the resynthesized sound. Audition the analysis through your orchestra to hear the change.
