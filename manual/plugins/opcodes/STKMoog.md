# STKMoog

STKMoog produces moog-like swept filter sounds.

## Description

STKMoog produces moog-like swept filter sounds, using one attack wave, one looped wave, and an ADSR envelope and adds two sweepable formant filters.

## Syntax

``` text
asignal STKMoog ifrequency, iamplitude, [kq, kv1[, krate, kv2[, klfo, kv3[, klfodepth, kv4[, kvol, kv5]]]]]
```

## Initialization

*ifrequency* -- Frequency of note played, in Hertz.

*iamplitude* -- Amplitude of note played (range 0-1).

## Performance

*kq* -- controller 2, Q filter. Value range of kv1 is 0-127.

*krate* -- controller 4, rate of filter sweep. Value range of kv2 is 0-127.

*klfo* -- controller 11, speed of low-frequency oscillator. Value range of kv3 is 0-127.

*klfodepth* -- controller 1, depth of low-frequency oscillator. Value range of kv4 is 0-127.

*kvol* -- controller 128, volume. Value range of kv5 is 0-127.


> **Note**
> The code for this opcode is taken directly from the Moog class in the Synthesis Toolkit in C++ by Perry R. Cook and Gary P. Scavone. More on the STK classes can be found here: <https://ccrma.stanford.edu/software/stk/classes.html>
>
> *kc1, kv1, kc2, kv2, kc3, kv3, kc4, kv4, kc5, kv5, kc6, kv6, kc7, kv7, kc8, kv8* -- Up to 8 optional k-rate controller pairs for the STK opcodes. Each controller pair consists of a controller number (kc) followed by a controller value (kv). Both the controller numbers and the controller values are krate variables. However, during a performance, normally the controller numbers stay fixed while the corresponding controller values may change at any time. The order of the controller pair is arbitrary, as long as they are after *iamplitude*. Also, it is not needed that all controller pairs are used.

## Examples

Here is an example of the STKMoog opcode. It uses the file [STKMoog.csd](../examples/STKMoog.csd).

``` csound-csd
--8<-- "examples/STKMoog.csd"
```

## See also

[STK Opcodes](../plugins/index.md#stk)

## Credits

Author: Michael Gogins (after Perry Cook), Irreducible Productions, New York, NY

New in Csound version 5.11
