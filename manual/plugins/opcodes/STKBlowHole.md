# STKBlowHole

STK clarinet physical model with one register hole and one tonehole.

## Description

This opcode is based on the clarinet model, with the addition of a two-port register hole and a three-port dynamic tonehole implementation.

In this implementation, the distances between the reed/register hole and tonehole/bell are fixed. As a result, both the tonehole and register hole will have variable influence on the playing frequency, which is dependent on the length of the air column. In addition, the highest playing freqeuency is limited by these fixed lengths.

## Syntax

``` text
asignal STKBlowHole ifrequency, iamplitude, [kreed, kv1[, knoise, kv2[, khole, kv3[, kreg, kv4[, kbreath, kv5]]]]]
```

## Initialization

*ifrequency* -- Frequency of note played, in Hertz.

*iamplitude* -- Amplitude of note played (range 0-1).

## Performance

*kreed* -- controller 2, stiffness of reed. Value range of kv1 is 0-127.

*knoise* -- controller 4, gain of noise. Value range of kv2 is 0-127.

*khole* -- controller 11, state of tonehole. Value range of kv3 is 0-127.

*kreg* -- controller 1, state of register. Value range of kv4 is 0-127.

*kbreath* -- controller 128, breath pressure. Value range of kv5 is 0-127.


> **Note**
> The code for this opcode is taken directly from the BlowHole class in the Synthesis Toolkit in C++ by Perry R. Cook and Gary P. Scavone. More on the STK classes can be found here: <https://ccrma.stanford.edu/software/stk/classes.html>
>
> *kc1, kv1, kc2, kv2, kc3, kv3, kc4, kv4, kc5, kv5, kc6, kv6, kc7, kv7, kc8, kv8* -- Up to 8 optional k-rate controller pairs for the STK opcodes. Each controller pair consists of a controller number (kc) followed by a controller value (kv). Both the controller numbers and the controller values are krate variables. However, during a performance, normally the controller numbers stay fixed while the corresponding controller values may change at any time. The order of the controller pair is arbitrary, as long as they are after *iamplitude*. Also, it is not needed that all controller pairs are used.

## Examples

Here is an example of the STKBlowHole opcode. It uses the file [STKBlowHole.csd](../examples/STKBlowHole.csd).

``` csound-csd
--8<-- "examples/STKBlowHole.csd"
```

## See also

[STK Opcodes](../plugins/index.md#stk)

## Credits

Author: Michael Gogins (after Perry Cook), Irreducible Productions, New York, NY

New in Csound version 5.11
