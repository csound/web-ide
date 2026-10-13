# SDIF Converter

Convert SDIF partial tracks into additive synthesis data for adsyn.

## Choose a partial analysis

Open an SDIF file containing **1TRC** partial tracks. SDIF can store many kinds of data, and this tool specifically reads partial frequency and amplitude tracks. It is not a general converter for every SDIF matrix type.

Choose a stream when the file contains more than one. The plot helps you see the partials before converting.

## Select the part to keep

Set a time range, a partial limit, and gain. The selected duration can be at most 32.76 seconds because the target format stores time within a limited range. Choose a shorter region for longer analyses.

Changes rebuild the conversion after a short pause. Wait for the result to match the current settings before exporting.

## Use the result

Download the `adsyn` data or add it to the local project files. The tool shows a Csound usage example for the result. Use that in your orchestra and adjust the playback level before listening.

To edit harmonic data as text afterward, see [HETRO Editor](hetro-editor.md).
