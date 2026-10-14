# imagesave

Save a previously created image.

## Description

Save a previously created image. An empty image can be created with [imagecreate](/manual/imagecreate/) and its pixel RGB values can be set with [imagesetpixel](/manual/imagesetpixel/). The image will be saved in PNG format.

## Syntax

``` text
imagesave iimagenum, filename
```

## Initialization

*iimagenum* -- the reference of the image to be save. It should be a value returned by [imagecreate](/manual/imagecreate/).

*filename* -- The filename to use to save the image.

## Examples

Here is an example of the imagesave opcode. It uses the file [imageopcodes.csd](../examples/imageopcodes.csd) and [imageOpcode01.png](../examples/imageOpcode01.png).

``` csound-csd
--8<-- "examples/imageopcodes.csd"
```

This is what the saved image imageOUT.png looks like:

![](../images/imageOUTsmall.png)

## See also

[Image processing opcodes](../plugins/index.md#image)

## Credits

Author: Cesare Marilungo

New in version 5.08
