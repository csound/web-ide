# Convolution Prep

Prepare an audio impulse response for Csound's convolve opcode.

## Choose a response

Open an impulse-response audio file. This can be a response you already have or one made with [Impulse Response](impulse-response.md).

Select the channel and the range you want to keep. The selected length must be between 0.01 and 10 seconds. Trim away unwanted silence before the response if it adds delay you do not want.

## Check the selected sound

The waveform and player show the selected response audio. Changing the range or channel rebuilds the analysis after a short pause. The player does not audition a dry sound processed through the response.

## Export the analysis

Download the `.cv` result or add it to the local file list. This is convolution analysis data for `convolve`, not a WAV file.

Other convolution opcodes, including `ftconv` workflows, can have different input requirements. Check the opcode's manual entry before converting. If it expects an audio file or a function table loaded from audio, keep the WAV response instead.
