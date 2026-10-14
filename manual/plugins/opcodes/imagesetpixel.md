# imagesetpixel

Set the RGB value of a pixel inside a previously opened or created image.

## Description

Set the RGB value of a pixel inside a previously opened or created image. An image can be loaded with [imageload](/manual/imageload/). An empty image can be created with [imagecreate](/manual/imagecreate/) and saved with [imagesave](/manual/imagesave/).

## Syntax

``` text
imagesetpixel iimagenum, ax, ay, ared, agreen, ablue
```

``` text
imagesetpixel iimagenum, kx, ky, kred, kgreen, kblue
```

## Initialization

*iimagenum* -- the reference of the image.. It should be a value returned by [imageload](/manual/imageload/) or [imagecreate](/manual/imagecreate/).

## Performance

*ax (kx)* -- horizontal pixel position (must be a float from 0 to 1).

*ay (ky)* -- vertical pixel position (must be a float from 0 to 1).

*ared (kred)* -- red value of the pixel (mapped to a float from 0 to 1).

*agreen (kgreen)* -- green value of the pixel (mapped to a float from 0 to 1).

*ablue (kblue)* -- blue value of the pixel (mapped to a float from 0 to 1).

## Examples

Here is an example of the imagesetpixel opcode. It uses the file [imagesetpixel.csd](../examples/imagesetpixel.csd) and [imageOpcode02.png](../examples/imageOpcode02.png).

``` csound-csd
--8<-- "examples/imagesetpixel.csd"
```

This is what the image imageOpcode02.png looks like:

and these are the new images imageNEW1.png, imageNEW2.png and imageNEW3.png:

![](../images/imageOpcode02small.png)

![](../images/imageNEW1small.png)

![](../images/imageNEW2small.png)

![](../images/imageNEW3small.png)

## See also

[Image processing opcodes](../plugins/index.md#image)

## Credits

Author: Cesare Marilungo

New in version 5.08
