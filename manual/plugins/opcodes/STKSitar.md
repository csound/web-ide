# STKSitar

STKSitar uses a plucked string physical model.

## Description

STKSitar uses a plucked string physical model based on the Karplus-Strong algorithm.

## Syntax

``` text
asignal STKSitar ifrequency, iamplitude
```

## Initialization

*ifrequency* -- Frequency of note played, in Hertz.

*iamplitude* -- Amplitude of note played (range 0-1).


> **Note**
> The code for this opcode is taken directly from the Sitar class in the Synthesis Toolkit in C++ by Perry R. Cook and Gary P. Scavone. More on the STK classes can be found here: <https://ccrma.stanford.edu/software/stk/classes.html>

## Examples

Here is an example of the STKSitar opcode. It uses the file [STKSitar.csd](../examples/STKSitar.csd).

``` csound-csd
--8<-- "examples/STKSitar.csd"
```

## See also

[STK Opcodes](../plugins/index.md#stk)

## Credits

Author: Michael Gogins (after Perry Cook), Irreducible Productions, New York, NY

New in Csound version 5.11
