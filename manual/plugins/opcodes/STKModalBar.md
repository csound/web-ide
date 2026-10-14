# STKModalBar

STKModalBar is a resonant bar instrument.

## Description

This opcode is a resonant bar instrument.It has a number of different struck bar instruments.

## Syntax

``` text
asignal STKModalBar ifrequency, iamplitude, [khard, kv1[, kpos, kv2[, klfo, kv3[, klfodepth, kv4[, kmix, kv5[, kvol, kv6[, kinstr, kv7]]]]]]]
```

## Initialization

*ifrequency* -- Frequency of note played, in Hertz.

*iamplitude* -- Amplitude of note played (range 0-1).

## Performance

*khard* -- controller 2, hardness of the stick. Value range of kv1 is 0-127.

*kpos* -- controller 4, stick position. Value range of kv2 is 0-127.

*klfo* -- controller 11, speed of low-frequency oscillator. Value range of kv3 is 0-127.

*klfodepth* -- controller 1, depth of low-frequency oscillator. Value range of kv4 is 0-127.

*kmix* -- controller 8, direct stick mix. Value range of kv5 is 0-127.

*kvol* -- controller 128, volume. Value range of kv6 is 0-127.

*kinstr* -- controller 16, instrument presets (0 = marimba, 1 = vibraphone, 2 = agogo, 3 = wood1, 4 = reso, 5 = wood2, 6 = beats, 7 = two fixed, 8 = clump). Value range of kv7 is 0-16.


> **Note**
> The code for this opcode is taken directly from the ModalBar class in the Synthesis Toolkit in C++ by Perry R. Cook and Gary P. Scavone. More on the STK classes can be found here: <https://ccrma.stanford.edu/software/stk/classes.html>
>
> *kc1, kv1, kc2, kv2, kc3, kv3, kc4, kv4, kc5, kv5, kc6, kv6, kc7, kv7, kc8, kv8* -- Up to 8 optional k-rate controller pairs for the STK opcodes. Each controller pair consists of a controller number (kc) followed by a controller value (kv). Both the controller numbers and the controller values are krate variables. However, during a performance, normally the controller numbers stay fixed while the corresponding controller values may change at any time. The order of the controller pair is arbitrary, as long as they are after *iamplitude*. Also, it is not needed that all controller pairs are used.

## Examples

Here is an example of the STKModalBar opcode. It uses the file [STKModalBar.csd](../examples/STKModalBar.csd).

``` csound-csd
--8<-- "examples/STKModalBar.csd"
```

## See also

[STK Opcodes](../plugins/index.md#stk)

## Credits

Author: Michael Gogins (after Georg Essl), Irreducible Productions, New York, NY

New in Csound version 5.11
