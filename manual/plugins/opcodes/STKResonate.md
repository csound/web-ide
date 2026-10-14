# STKResonate

STKResonate is a noise driven formant filter.

## Description

STKResonate is a noise driven formant filter. This instrument contains a noise source, which excites a biquad resonance filter, with volume controlled by an ADSR.

## Syntax

``` text
asignal STKResonate ifrequency, iamplitude, [kfreq, kv1[, kpole, kv2[, knotch, kv3[, kzero, kv4[, kenv, kv5]]]]]
```

## Initialization

*ifrequency* -- Frequency of note played, in Hertz.

*iamplitude* -- Amplitude of note played (range 0-1).

## Performance

*kfreq* -- controller 2, frequency of resonance. Value range of kv1 is 0-127.

*kpole* -- controller 4, pole radii. Value range of kv2 is 0-127.

*knotch* -- controller 11, notch frequency. Value range of kv3 is 0-127.

*kzero* -- controller 1, zero radii. Value range of kv4 is 0-127.

*kenv* -- controller 128, gain of envelope. Value range of kv5 is 0-127.


> **Note**
> The code for this opcode is taken directly from the Resonate class in the Synthesis Toolkit in C++ by Perry R. Cook and Gary P. Scavone. More on the STK classes can be found here: <https://ccrma.stanford.edu/software/stk/classes.html>
>
> *kc1, kv1, kc2, kv2, kc3, kv3, kc4, kv4, kc5, kv5, kc6, kv6, kc7, kv7, kc8, kv8* -- Up to 8 optional k-rate controller pairs for the STK opcodes. Each controller pair consists of a controller number (kc) followed by a controller value (kv). Both the controller numbers and the controller values are krate variables. However, during a performance, normally the controller numbers stay fixed while the corresponding controller values may change at any time. The order of the controller pair is arbitrary, as long as they are after *iamplitude*. Also, it is not needed that all controller pairs are used.

## Examples

Here is an example of the STKResonate opcode. It uses the file [STKResonate.csd](../examples/STKResonate.csd).

``` csound-csd
--8<-- "examples/STKResonate.csd"
```

## See also

[STK Opcodes](../plugins/index.md#stk)

## Credits

Author: Michael Gogins (after Perry Cook), Irreducible Productions, New York, NY

New in Csound version 5.11
