# imagegetpixel

Return the RGB pixel values of a previously opened or created image.

## Description

Return the RGB pixel values of a previously opened or created image. An image can be loaded with [imageload](/manual/imageload/). An empty image can be created with [imagecreate](/manual/imagecreate/).

## Syntax

``` text
ared, agreen, ablue imagegetpixel iimagenum, ax, ay
```

``` text
kred, kgreen, kblue imagegetpixel iimagenum, kx, ky
```

## Initialization

*iimagenum* -- the reference of the image. It should be a value returned by [imageload](/manual/imageload/) or [imagecreate](/manual/imagecreate/).

## Performance

*ax (kx)* -- horizontal pixel position (must be a float from 0 to 1).

*ay (ky)* -- vertical pixel position (must be a float from 0 to 1).

*ared (kred)* -- red value of the pixel (mapped to a float from 0 to 1).

*agreen (kgreen)* -- green value of the pixel (mapped to a float from 0 to 1).

*ablue (kblue)* -- blue value of the pixel (mapped to a float from 0 to 1).

## Examples

Here is an example of the imagegetpixel opcode. It uses the files [imagegetpixel.csd](../examples/imagegetpixel.csd), [imageOpcode01.png](../examples/imageOpcode01.png) and [imageOpcode02.png](../examples/imageOpcode02.png).

``` csound-csd
--8<-- "examples/imagegetpixel.csd"
```

Here is what the images imageOpcode01.png and imageOpcode02.pngfor the imagegetpixel example look like:

Here is a musical example of the imagegetpixel opcode. It uses the files [imagegetpixel-musical.csd](../examples/imagegetpixel-musical.csd) and [imageOpcode03.png](../examples/imageOpcode03.png).

``` csound-csd
--8<-- "examples/imagegetpixel-musical.csd"
```

This is what the image imageOpcode03.png for the imagegetpixel-musical example looks like:

![](../images/imageOpcode01small.png)

![](../images/imageOpcode02small.png)

![](../examples/imageOpcode03.png)

## See also

[Image processing opcodes](../plugins/index.md#image)

## Credits

Author: Cesare Marilungo

New in version 5.08
