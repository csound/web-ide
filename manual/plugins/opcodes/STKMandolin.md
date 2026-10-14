# STKMandolin

STKMandolin produces mandolin-like sounds.

## Description

STKMandolin produces mandolin-like sounds, using "commuted synthesis" techniques to model a mandolin instrument.

## Syntax

``` text
asignal STKMandolin ifrequency, iamplitude, [kbody, kv1[, kpos, kv2[, ksus, kv3[, kdetune, kv4[, kmic, kv5]]]]]
```

## Initialization

*ifrequency* -- Frequency of note played, in Hertz.

*iamplitude* -- Amplitude of note played (range 0-1).

## Performance

*kbody* -- controller 2, size of body. Value range of kv1 is 0-127.

*kpos* -- controller 4, pluck position. Value range of kv2 is 0-127.

*ksus* -- controller 11, string sustain. Value range of kv3 is 0-127.

*kdetune* -- controller 1, string detuning. Value range of kv4 is 0-127.

*kmic* -- controller 128, position of microphone. Value range of kv5 is 0-127.


> **Note**
> The code for this opcode is taken directly from the Mandolin class in the Synthesis Toolkit in C++ by Perry R. Cook and Gary P. Scavone. More on the STK classes can be found here: <https://ccrma.stanford.edu/software/stk/classes.html>
>
> *kc1, kv1, kc2, kv2, kc3, kv3, kc4, kv4, kc5, kv5, kc6, kv6, kc7, kv7, kc8, kv8* -- Up to 8 optional k-rate controller pairs for the STK opcodes. Each controller pair consists of a controller number (kc) followed by a controller value (kv). Both the controller numbers and the controller values are krate variables. However, during a performance, normally the controller numbers stay fixed while the corresponding controller values may change at any time. The order of the controller pair is arbitrary, as long as they are after *iamplitude*. Also, it is not needed that all controller pairs are used.

## Examples

Here is an example of the STKMandolin opcode. It uses the file [STKMandolin.csd](../examples/STKMandolin.csd).

``` csound-csd
--8<-- "examples/STKMandolin.csd"
```

## See also

[STK Opcodes](../plugins/index.md#stk)

## Credits

Author: Michael Gogins (after Perry Cook), Irreducible Productions, New York, NY

New in Csound version 5.11
