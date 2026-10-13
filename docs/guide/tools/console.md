# Console

Read messages from the running piece and find out why compilation stopped.

## Find the useful message

Open Console below or beside the editor. It shows Csound startup messages, prints from your instruments, and compiler or performance errors.

When compilation fails, read the first error and its file and line information. Later messages can be consequences of that first problem. If an include file has an error, open that file rather than only checking the main CSD.

## Printing from an instrument

Use Csound's printing opcodes to inspect values while a piece runs. Keep the print interval reasonable: a message every control cycle can fill the console quickly.

## Separate messages from input

A MIDI or audio startup message does not by itself explain every silent instrument. Check [MIDI input](../editor/midi.md) or [Audio input](../editor/audio-input.md), then inspect your instrument's routing and level.

The [background syntax checker](../editor/code-help.md) helps while editing. The console still shows the result of the actual compile and performance.
