# Spectral Analyzer

Watch the frequency content of the current Csound output.

## Start with sound

Open the analyzer and run a piece. Its spectrum shows the current frequency balance, while the spectrogram shows how that balance changes over time.

The analyzer listens to the running Csound output. It does not create a saved analysis file from a sample. Use [Audio Analysis](audio-analysis.md) for that.

## Read the display

Low frequencies sit at one end of the frequency scale and high frequencies at the other. Stronger levels stand out in the spectrum and spectrogram. A sustained note gives a useful way to see its fundamental and upper harmonics.

Use **Freeze** to hold the display while the audio keeps playing. Resume the display to watch changes again. Adjust the available view controls to inspect the part of the spectrum you need.

## Compare a change

Try changing a filter cutoff or adding a harmonic in your instrument, then compare the display. Listen as well: two sounds with similar spectra can still sound quite different over time.
