# MIDI input

Play Csound instruments from a controller or the on-screen keyboard.

## Prepare the instrument

The orchestra must accept MIDI notes and stay running while you play. A CSD can request realtime MIDI with `-M0` in CsOptions. Its instruments still need to map incoming notes and velocity to sound, using opcodes such as `cpsmidi` and `ampmidi`.

For a complete starting instrument, choose **MIDI instrument** when creating a project. It maps all MIDI channels to a synth with a filter and a release envelope. Press Play before sending notes, then press Stop when finished. See the [Csound Manual](../tools/manual.md) for more examples.

## Connect a controller

Open **I/O → MIDI** and press **Connect MIDI** to list your controllers. If the browser asks for MIDI access, allow it for this site. Playback of a MIDI piece can also ask for access. The IDE does not request SysEx access.

**Use all controllers** is on by default, including controllers connected during playback. Uncheck it to choose individual inputs. Choose a receive channel if you want to filter their messages. Save your choices, then restart playback. Selecting no controllers disables hardware input; the virtual keyboard still works and bypasses the channel filter.

Use **All notes off** to release stuck notes in the running piece. These settings route input to Csound; they do not send notes to external synths.

[Web MIDI support](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API#browser_compatibility) varies by browser and device. If hardware input is unavailable, try the [Virtual MIDI Keyboard](../tools/midi-keyboard.md).

When no notes sound, first check that Csound is running and the instrument listens on the channel your controller sends. Then check browser MIDI permission and the console for errors.

## MIDI files and rendering

A `.mid` file is event data, not recorded audio. Upload it to the project if your Csound code reads it. Offline rendering needs file-based or score-based events instead of a live controller. See [Playback and rendering](playback.md).
