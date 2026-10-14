# Audio input

Use a microphone or audio interface in a running Csound piece.

Choose **Live audio processing** when creating a project for a working starting point. It reads one input channel, removes DC offset, and applies a low-pass filter at a reduced output level. Use headphones, press Play, and allow microphone access. Press Stop when finished.

## Request input

Add `-iadc` to CsOptions along with `-odac` for live output. Read the signal with an input opcode such as `inch`. The first time you run the piece, the browser may ask for microphone access.

```csound
<CsOptions>
-odac -iadc
</CsOptions>
```

Set the orchestra's input channel count to suit the piece.

## Choose a device

Open **I/O → Audio Input** to choose a microphone or audio interface. **Test input** asks for permission, reveals device names, and shows a level meter. The test does not play the microphone through the speakers. Stop it or close the dialog to release the microphone.

Use all available channels, or select one channel from an interface. A single selected channel reaches Csound as input channel 1. If the browser cannot supply it, playback reports an error instead of choosing another input.

Echo cancellation, noise suppression, and automatic gain sit under **Microphone processing**. They start off to preserve musical signals. Some browsers do not support every setting.

Save your choices, then restart playback to use them. These settings stay in this browser, not in the project.

## Listen safely

Use headphones while testing a live microphone. If speakers feed the microphone, even a small amount of gain can build into feedback. Begin at low output volume and keep Stop within reach.

## When input is silent

Check the site's microphone permission and the operating system's privacy settings. Confirm that the chosen device has an input signal, then stop and restart the piece after changing permissions.

The [Console](../tools/console.md) reports input startup errors. An offline render cannot use the microphone: record or upload audio first, then read that file in the render.
