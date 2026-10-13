# Code help and syntax checks

Find opcode arguments and catch errors without starting playback.

## Completion and synopsis

Start typing an opcode name to get completion suggestions. The synopsis near the editor shows its arguments. When an opcode has a manual entry, **Open in manual** takes you to that article, reusing an open manual panel or opening one on the right.

## Background checks

After you pause typing, the optional Csound checker can mark syntax errors in the gutter and underline the reported position. Hover the marker or underline to read the message. Checks run in the background so they do not interrupt each keystroke.

A successful check updates known user-defined opcodes, including definitions reached through project includes. During a failed check, the editor keeps the last successful symbols. A renamed opcode can therefore keep its old suggestion until a later check succeeds.

## Plugins and limits

The checker can use supported WebAssembly opcode plugins in the project to learn their symbols and signatures. A desktop native library cannot run in the browser. Plugin loading or include errors can prevent a full check.

Background checking is optional. If its engine is unavailable, you can still edit and compile by pressing Play. Read the [Console](../tools/console.md) for errors from that full run.
