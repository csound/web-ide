# STKSaxofony

STKSaxofony is a faux conical bore reed instrument.

## Description

STKSaxofony is a faux conical bore reed instrument. This opcode uses a "hybrid" digital waveguide instrument that can generate a variety of wind-like sounds. It has also been referred to as the "blowed string" model. The waveguide section is essentially that of a string, with one rigid and one lossy termination. The non-linear function is a reed table. The string can be "blown" at any point between the terminations, though just as with strings, it is impossible to excite the system at either end. If the excitation is placed at the string mid-point, the sound is that of a clarinet. At points closer to the "bridge", the sound is closer to that of a saxophone.

## Syntax

``` text
asignal STKSaxofony ifrequency, iamplitude, [kstiff, kv1[, kapert, kv2[, kblow, kv3[, knoise, kv4[, klfo, kv5[, klfodepth, kv6[, kbreath, kv7]]]]]]]
```

## Initialization

*ifrequency* -- Frequency of note played, in Hertz.

*iamplitude* -- Amplitude of note played (range 0-1).

## Performance

*kstiff* -- controller 2, stiffness of reed. Value range of kv1 is 0-127.

*kapert* -- controller 26, reed aperture. Value range of kv2 is 0-127.

*kblow* -- controller 11, blow position. Value range of kv3 is 0-127.

*knoise* -- controller 4, noise gain. Value range of kv4 is 0-127.

*klfo* -- controller 29, speed of low-frequency oscillator. Value range of kv5 is 0-127.

*klfodepth* -- controller 1, depth of low-frequency oscillator. Value range of kv6 is 0-127.

*kbreath* -- controller 128, breath pressure. Value range of kv7 is 0-127.


> **Note**
> The code for this opcode is taken directly from the Saxofony class in the Synthesis Toolkit in C++ by Perry R. Cook and Gary P. Scavone. More on the STK classes can be found here: <https://ccrma.stanford.edu/software/stk/classes.html>
>
> *kc1, kv1, kc2, kv2, kc3, kv3, kc4, kv4, kc5, kv5, kc6, kv6, kc7, kv7, kc8, kv8* -- Up to 8 optional k-rate controller pairs for the STK opcodes. Each controller pair consists of a controller number (kc) followed by a controller value (kv). Both the controller numbers and the controller values are krate variables. However, during a performance, normally the controller numbers stay fixed while the corresponding controller values may change at any time. The order of the controller pair is arbitrary, as long as they are after *iamplitude*. Also, it is not needed that all controller pairs are used.

## Examples

Here is an example of the STKSaxofony opcode. It uses the file [STKSaxofony.csd](../examples/STKSaxofony.csd).

``` csound-csd
--8<-- "examples/STKSaxofony.csd"
```

## See also

[STK Opcodes](../plugins/index.md#stk)

## Credits

Author: Michael Gogins (after Georg Essl), Irreducible Productions, New York, NY

New in Csound version 5.11
