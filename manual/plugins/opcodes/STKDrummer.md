# STKDrummer

STKDrummer is a drum sampling synthesizer.

## Description

STKDrummer is a drum sampling synthesizer using raw waves and one-pole filters, The drum rawwave files are sampled at 22050 Hz, but will be appropriately interpolated for other sample rates.

## Syntax

``` text
asignal STKDrummer ifrequency, iamplitude
```

## Initialization

*ifrequency* -- Samples being played.

*iamplitude* -- Amplitude of note played (range 0-1).


> **Note**
> The code for this opcode is taken directly from the Drummer class in the Synthesis Toolkit in C++ by Perry R. Cook and Gary P. Scavone. More on the STK classes can be found here: <https://ccrma.stanford.edu/software/stk/classes.html>

## Examples

Here is an example of the STKDrummer opcode. It uses the file [STKDrummer.csd](../examples/STKDrummer.csd).

``` csound-csd
--8<-- "examples/STKDrummer.csd"
```

## See also

[STK Opcodes](../plugins/index.md#stk)

## Credits

Author: Michael Gogins (after Perry Cook), Irreducible Productions, New York, NY

New in Csound version 5.11
