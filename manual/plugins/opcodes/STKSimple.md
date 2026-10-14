# STKSimple

STKSimple is a wavetable/noise instrument.

## Description

STKSimple is a wavetable/noise instrument. It combines a looped wave, a noise source, a biquad resonance filter, a one-pole filter, and an ADSR envelope to create some interesting sounds.

## Syntax

``` text
asignal STKSimple ifrequency, iamplitude, [kpos, kv1[, kcross, kv2[, kenv, kv3[, kgain, kv4]]]]
```

## Initialization

*ifrequency* -- Frequency of note played, in Hertz.

*iamplitude* -- Amplitude of note played (range 0-1).

## Performance

*kpos* -- controller 2, position of filter pole. Value range of kv1 is 0-127.

*kcross* -- controller 4, noise/pitched cross-fade. Value range of kv2 is 0-127.

*kenv* -- controller 11, rate of envelope. Value range of kv3 is 0-127.

*kgain* -- controller 128, gain. Value range of kv4 is 0-127.


> **Note**
> The code for this opcode is taken directly from the Simple class in the Synthesis Toolkit in C++ by Perry R. Cook and Gary P. Scavone. More on the STK classes can be found here: <https://ccrma.stanford.edu/software/stk/classes.html>
>
> *kc1, kv1, kc2, kv2, kc3, kv3, kc4, kv4, kc5, kv5, kc6, kv6, kc7, kv7, kc8, kv8* -- Up to 8 optional k-rate controller pairs for the STK opcodes. Each controller pair consists of a controller number (kc) followed by a controller value (kv). Both the controller numbers and the controller values are krate variables. However, during a performance, normally the controller numbers stay fixed while the corresponding controller values may change at any time. The order of the controller pair is arbitrary, as long as they are after *iamplitude*. Also, it is not needed that all controller pairs are used.

## Examples

Here is an example of the STKSimple opcode. It uses the file [STKSimple.csd](../examples/STKSimple.csd).

``` csound-csd
--8<-- "examples/STKSimple.csd"
```

## See also

[STK Opcodes](../plugins/index.md#stk)

## Credits

Author: Michael Gogins (after Perry Cook), Irreducible Productions, New York, NY

New in Csound version 5.11
