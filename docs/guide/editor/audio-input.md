# Audio input

Use a microphone or audio interface in a running Csound piece.

## Request input

Add `-iadc` to CsOptions along with `-odac` for live output. Read the signal with an input opcode such as `inch`. The first time you run the piece, the browser may ask for microphone access.

```csound
<CsOptions>
-odac -iadc
</CsOptions>
```

Set the orchestra's input channel count to suit the piece. Browser and operating-system settings decide which input device the page receives.

## Listen safely

Use headphones while testing a live microphone. If speakers feed the microphone, even a small amount of gain can build into feedback. Begin at low output volume and keep Stop within reach.

## When input is silent

Check the site's microphone permission and the operating system's privacy settings. Confirm that the chosen device has an input signal, then stop and restart the piece after changing permissions.

The [Console](../tools/console.md) reports input startup errors. An offline render cannot use the microphone: record or upload audio first, then read that file in the render.
