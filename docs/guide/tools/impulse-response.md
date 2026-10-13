# Impulse Response

Make a reference sweep and recover a response from a recording of that sweep.

## Make the reference

Choose a sweep length and sample rate, then download the generated sweep. The supported length is 0.01 to 10 seconds. Keep this exact reference file for the next step.

Play the sweep through the room or system you want to measure and record its output. The tool works from files; it does not run a microphone measurement session for you.

## Extract the response

Choose the mono reference sweep and its recording. Select the recording channel you want to use. Both files must have the same sample rate.

Align the recording's start with the sweep and trim it to between one and two sweep lengths. [Sample Editor](sample-editor.md) can trim and resample it first. The tool then extracts an impulse response that you can audition and export as audio.

## Use the response

A convolution opcode that reads an audio impulse response can use the exported WAV. If you need the analysis format for `convolve`, continue in [Convolution Prep](convolution-prep.md).

Download the response or add it to the local file list. Keep the reference and recording as well if you may want to repeat the extraction.
