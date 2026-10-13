# MIDI input

Play Csound instruments from a controller or the on-screen keyboard.

## Prepare the instrument

The orchestra must accept MIDI notes and stay running while you play. A CSD can request realtime MIDI with `-M0` in CsOptions. Its instruments still need to map incoming notes and velocity to sound, using opcodes such as `cpsmidi` and `ampmidi`.

For a complete starting instrument, open a MIDI example in the [Csound Manual](../tools/manual.md). Press Play before sending notes.

## Connect a controller

Connect your controller before starting the piece. If the browser asks for MIDI access, allow it for this site. [Web MIDI support](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API#browser_compatibility) varies by browser and device. If hardware input is unavailable, try the [Virtual MIDI Keyboard](../tools/midi-keyboard.md).

When no notes sound, first check that Csound is running and the instrument listens on the channel your controller sends. Then check browser MIDI permission and the console for errors.

## MIDI files and rendering

A `.mid` file is event data, not recorded audio. Upload it to the project if your Csound code reads it. Offline rendering needs file-based or score-based events instead of a live controller. See [Playback and rendering](playback.md).
