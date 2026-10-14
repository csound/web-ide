# imageload

Load an image.

## Description

Load an image and return a reference to it. Individual pixel values can then be accessed with [imagegetpixel](/manual/imagegetpixel/).

> **Note**
> The image processing opcodes can only load png images

## Syntax

``` text
iimagenum imageload filename
```

## Initialization

*iimagenum* -- number assigned to the loaded image.

*filename* -- The filename of the image to load (should be a valid PNG image file).

## Examples

Here is an example of the imageload opcode. It uses the file [imageopcodes.csd](../examples/imageopcodes.csd) and [imageOpcode01.png](../examples/imageOpcode01.png).

``` csound-csd
--8<-- "examples/imageopcodes.csd"
```

This is what the image imageOpcode01.png looks like:

![](../images/imageOpcode01small.png)

## See also

[Image processing opcodes](../plugins/index.md#image)

## Credits

Author: Cesare Marilungo

New in version 5.08
