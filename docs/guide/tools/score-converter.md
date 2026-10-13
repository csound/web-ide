# Score Converter

Turn compact score languages into Csound events, or process an existing score.

## Choose the source language

Open Score Converter and select **CsBeats**, **SCOT**, **Csound score · Sort**, or the extraction mode. The left pane holds source text, and the right pane holds generated score text.

CsBeats and SCOT have different syntax. Start from the example for the selected language, then edit it. The matching converter loads when needed and updates the output after you pause typing.

## Use the output

Copy the result with the output pane's copy button and paste it inside a normal CsScore section or a `.sco` file. Conversion produces events; you still need orchestra instruments that match them.

Sorting puts an existing score in Csound's event order. Extraction uses a separate selection description to choose the part of a score to keep.

## Preprocess when the project runs

You can also put supported source directly in a CSD:

```xml
<CsScore bin="csbeats">
; Your CsBeats score goes here.
</CsScore>
```

Use `bin="scot"` for SCOT. The editor recognizes those score languages for highlighting, and the IDE loads the matching bundled program on demand. A score with a preprocessor is not eligible for static f-table plotting inside that section.

See the [Csound Manual](manual.md) for the language rules and examples before building a longer score.
