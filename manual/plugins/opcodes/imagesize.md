# imagesize

Return the width and height of a previously opened or created image.

## Description

Return the width and height of a previously opened or created image. An image can be loaded with [imageload](/manual/imageload/). An empty image can be created with [imagecreate](/manual/imagecreate/).

## Syntax

``` text
iwidth, iheight imagesize iimagenum
```

## Initialization

*iimagenum* -- the reference of the image.. It should be a value returned by [imageload](/manual/imageload/) or [imagecreate](/manual/imagecreate/).

*iwidth* -- image width.

*iheight* -- image height.

## Examples

Here is an example of the imagesize opcode. It uses the file [imageopcodes.csd](../examples/imageopcodes.csd) and [imageOpcode01.png](../examples/imageOpcode01.png).

``` csound-csd
--8<-- "examples/imageopcodes.csd"
```

    width = 512 pixels, heigth = 512 pixels
          

## See also

[Image processing opcodes](../plugins/index.md#image)

## Credits

Author: Cesare Marilungo

New in version 5.08
