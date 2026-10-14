# STKShakers

STKShakers is an instrument that simulates environmental sounds or collisions of multiple independent sound producing objects.

## Description

STKShakers are a set of PhISEM and PhOLIES instruments: PhISEM (Physically Informed Stochastic Event Modeling) is an algorithmic approach for simulating collisions of multiple independent sound producing objects. It can simulate a Maraca, Sekere, Cabasa, Bamboo Wind Chimes, Water Drops, Tambourine, Sleighbells, and a Guiro. On [](http://soundlab.cs.princeton.edu/research/controllers/shakers/) PhOLIES (Physically-Oriented Library of Imitated Environmental Sounds) there is a similar approach for the synthesis of environmental sounds. It simulates of breaking sticks, crunchy snow (or not), a wrench, sandpaper, and more..

## Syntax

``` text
asignal STKShakers ifrequency, iamplitude, [kenerg, kv1[, kdecay, kv2[, kshake, kv3[, knum, kv4[, kres, kv5[, kinstr, kv6]]]]]]
```

## Initialization

*ifrequency* -- Frequency of note played, in Hertz.

*iamplitude* -- Amplitude of note played (range 0-1).

## Performance

*kenerg* -- controller 2, shake energy. Value range of kv1 is 0-127.

*kdecay* -- controller 4, system decay. Value range of kv2 is 0-127.

*kshake* -- controller 128, shake energy. Value range of kv3 is 0-127.

*knum* -- controller 11, number of objects. Value range of kv4 is 0-127.

*kres* -- controller 1, resonance frequency. Value range of kv5 is 0-127.

*kinstr* -- controller 1071, instrument selection (Maraca = 0, Cabasa = 1, Sekere = 2, Guiro = 3, Water Drops = 4, Bamboo Chimes = 5, Tambourine = 6, Sleigh Bells = 7, Sticks = 8, Crunch = 9, Wrench = 10, Sand Paper = 11, Coke Can = 12, Next Mug = 13, Penny + Mug = 14, Nickle + Mug = 15, Dime + Mug = 16, Quarter + Mug = 17, Franc + Mug = 18, Peso + Mug = 19, Big Rocks = 20, Little Rocks = 21, Tuned Bamboo Chimes = 22). Value range of kv6 is 0-22.


> **Note**
> The code for this opcode is taken directly from the Shakers class in the Synthesis Toolkit in C++ by Perry R. Cook and Gary P. Scavone. More on the STK classes can be found here: <https://ccrma.stanford.edu/software/stk/classes.html>
>
> *kc1, kv1, kc2, kv2, kc3, kv3, kc4, kv4, kc5, kv5, kc6, kv6, kc7, kv7, kc8, kv8* -- Up to 8 optional k-rate controller pairs for the STK opcodes. Each controller pair consists of a controller number (kc) followed by a controller value (kv). Both the controller numbers and the controller values are krate variables. However, during a performance, normally the controller numbers stay fixed while the corresponding controller values may change at any time. The order of the controller pair is arbitrary, as long as they are after *iamplitude*. Also, it is not needed that all controller pairs are used.

## Examples

Here is an example of the STKShakers opcode. It uses the file [STKShakerscsd](../examples/STKShakers.csd).

``` csound-csd
--8<-- "examples/STKShakers.csd"
```

## See also

[STK Opcodes](../plugins/index.md#stk)

## Credits

Author: Michael Gogins (after Georg Essl), Irreducible Productions, New York, NY

New in Csound version 5.11
