# imagefree

Frees memory allocated for a previously loaded or created image.

## Description

Frees memory allocated for a previously loaded or created image.

## Syntax

``` text
imagefree iimagenum
```

## Initialization

*iimagenum* -- reference of the image to free.

## Examples

Here is an example of the imagefree opcode. It uses the file [imageopcodes.csd](../examples/imageopcodes.csd) and [imageOpcode01.png](../examples/imageOpcode01.png).

``` csound-csd
--8<-- "examples/imageopcodes.csd"
```

## See also

[Image processing opcodes](../plugins/index.md#image)

## Credits

Author: Cesare Marilungo

New in version 5.08
