# imagecreate

Create an empty image of a given size.

## Description

Create an empty image of a given size. Individual pixel values can then be set with [imagesetpixel](/manual/imagesetpixel/).

## Syntax

``` text
iimagenum imagecreate iwidth, iheight
```

## Initialization

*iimagenum* -- number assigned to the created image.

*iwidth* -- desired image width.

*iheight* -- desired image height.

## Examples

Here is an example of the imagecreate opcode. It uses the file [imageopcodes.csd](../examples/imageopcodes.csd) and [imageOpcode01.png](../examples/imageOpcode01.png).

``` csound-csd
--8<-- "examples/imageopcodes.csd"
```

The source image, imageOpcode01.png:

![Source image](../images/imageOpcode01small.png)

The created image, imageOUT.png:

![Created image](../images/imageOUTsmall.png)

## See also

[Image processing opcodes](../plugins/index.md#image)

## Credits

Author: Cesare Marilungo

New in version 5.08
