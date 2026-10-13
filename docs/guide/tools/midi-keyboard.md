# Virtual MIDI Keyboard

Play notes with the pointer or computer keyboard while Csound runs.

## Start a MIDI instrument

Open the tool and press Play on a project that accepts MIDI notes. Clicking a piano key sends note-on and releasing it sends note-off. The keyboard sends on MIDI channel 1 with a fixed velocity.

The piano does not make sound on its own. Your orchestra needs a MIDI instrument. See [MIDI input](../editor/midi.md) for setup.

## Change the range

Use **Z** to move down an octave and **X** to move up. The label above the piano shows the current range. The marked computer keys play the corresponding notes.

Keyboard shortcuts avoid text input fields and the source editor, so typing code does not unexpectedly play the piano. Move focus out of those fields to use the piano shortcuts.

## Use a hardware controller

If you need velocity-sensitive playing or more controls, connect a MIDI controller and allow MIDI access in a supported browser. You can keep the virtual keyboard open to test the instrument.
