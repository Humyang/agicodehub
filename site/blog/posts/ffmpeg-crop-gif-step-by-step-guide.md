---
title: "FFmpeg Crop GIF: A Step-by-Step Guide to Perfectly Trim Your Animations"
date: 2025-03-17
description: "Crop animations without border shimmer: coordinate constraints, chroma alignment, and why crop-before-scale keeps edges sharp."
tags: [FFmpeg]
legacy_id: 307
legacy_url: "https://www.dve2.com/archives/307/ffmpeg-crop-gif-a-step-by-step-guide-to-perfectly-trim-your-animations/"
restored_from: wayback
---

# FFmpeg Crop GIF: A Step-by-Step Guide to Perfectly Trim Your Animations

Cropping an animated GIF looks like a one-line job until the rectangle comes back rejected, or the result crawls one pixel along an edge for the whole loop. The `crop` filter never resamples: every pixel it keeps is a pixel that came out of the decoder untouched. That is excellent for sharpness and unforgiving for fractional offsets, odd dimensions, and graphs where every frame is measured separately. This note covers the constraints the filter enforces, the ones it silently works around, and the ordering decision that actually changes output quality — whether `crop` or `scale` runs first.

## Reading the crop signature

```bash
ffmpeg -i input.gif -vf "crop=480:270:120:60" -loop 0 cropped.gif
```

- `480:270` — output width and height (`out_w`/`out_h`, also written `w`/`h`).
- `120:60` — the top-left corner of the kept region (`x`/`y`), counted from the frame's left and top edges.
- Omit `x`/`y` and the filter centres the rectangle: `x=(in_w-out_w)/2`, `y=(in_h-out_h)/2`.

Every argument accepts an expression, and the expression is evaluated **per frame**. The useful variables are `iw`/`in_w`, `ih`/`in_h`, `ow`/`out_w`, `oh`/`out_h`, plus `n` (frame index), `t` (timestamp) and `pos`. The current `x`/`y` are readable inside their own expressions, which is how you clamp a moving rectangle.

## Constraints the filter enforces

A rectangle that extends past the frame is an error, not a clamp. Ask for `crop=480:270:400:60` on a 640-pixel-wide source and the filter graph stops instead of trimming the overflow. Clamp inside the expression and the command becomes safe to reuse on inputs you have not measured:

```bash
ffmpeg -i input.gif -vf 'crop=w=min(iw\,480):h=min(ih\,270):x=(iw-ow)/2:y=(ih-oh)/2' -loop 0 out.gif
```

The escaped comma matters. In a filter graph, `,` separates filters in a chain and `:` separates options inside a filter, so commas inside an expression must be written `\,`. Single-quoting the whole graph protects it from the shell and is the least surprising habit.

Dimensions are the second constraint. A GIF decodes to packed RGB, where the chroma grid is 1×1 and odd numbers are harmless. The same graph applied to a 4:2:0 video source (MP4 in, GIF out) has `hsub`/`vsub` of 2, and odd `out_w`/`out_h` either fails the encoder or forces an internal adjustment. Two ways out: pass even numbers, or align explicitly with `x='trunc(160/hsub)*hsub'` and the same trick for `y`.

The `exact` option controls that adjustment. With the default `exact=0`, subsampled input may have its rectangle nudged onto the chroma grid so the output stays encodable — which is convenient and also the reason a coordinate you typed is not always the coordinate you got. Set `exact=1` when you need the literal rectangle, and verify the dimensions afterwards rather than trusting the number you wrote.

## When the rectangle moves by itself

Because expressions are per-frame, a GIF whose frames are not all the same size — concatenated clips, hand-edited exports — produces a different `iw`/`ih` each frame, so a centred crop shifts and the border appears to crawl. Confirm the geometry before cropping:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames -of csv=p=0 input.gif
```

One width/height pair and a frame count is what you want. If a batch disagrees, normalise the canvas first (scale to a fixed box, `pad` to fill) and crop the normalised stream, rather than letting the rectangle track whatever the decoder reports.

## Crop then scale, or scale then crop?

This is the part that decides quality.

**Crop first, scale second.** The filter works on full-resolution pixels, then a single resample produces the final size. Downscaling averages neighbouring pixels, so the crop boundary acquires sub-pixel coverage and lands smoothly instead of aliasing. Cost: the whole chain runs at source resolution.

```bash
ffmpeg -i input.gif -vf "crop=480:270:120:60,scale=480:270:flags=lanczos" -loop 0 out.gif
```

**Scale first, crop second.** Cheaper, and pointless if nothing follows: `crop` cannot antialias, so the boundary is a hard integer cut taken from an already-downsampled image. Offsets get quantised by the scale factor, and any later upscale magnifies the stair-stepping along the cut edge.

The rule that covers both: resample exactly once, last, and only downward. `crop` → `scale` with `flags=lanczos` (or `area` when shrinking hard) is the ordering to reach for; `scale` → `crop` → `scale` is where softness comes from.

For a stubborn jagged border, give the resampler something to average. Crop two pixels wider on each side, then scale to the target — the outer ring is the sampling margin:

```bash
ffmpeg -i input.gif -vf "crop=484:274:118:58,scale=480:270:flags=lanczos" -loop 0 out.gif
```

## Transparency and palette side effects

Scaling an image with an alpha channel blends colour into transparent pixels (the filter does not premultiply), which shows up as a dark or coloured halo hugging the new edge. `crop` does not resample, so a crop-only pass preserves transparency cleanly; if you must resize a transparent GIF, keep the margin trick above small, or letterbox onto a known background instead.

Palette generation sees whatever geometry precedes it, so build the palette from the final framing, not the source:

```bash
ffmpeg -i input.gif -filter_complex "[0:v]crop=484:274:118:58,scale=480:270:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop 0 out.gif
```

Batching the same geometry across a directory:

```bash
for f in *.gif; do ffmpeg -y -i "$f" -vf "crop=480:270:120:60" "crop_$f"; done
```

## Before you ship it

Check four things: the rectangle fits every frame (`iw`/`ih` from `ffprobe`, not from memory); width and height are even if a 4:2:0 source is upstream; exactly one `scale` runs after the `crop`, with an explicit `flags`; and the result is viewed on both a light and a dark background, since a one-pixel offset or halo is invisible on the page you tested and obvious on the next one.

---

::: tip About this article
Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; tool links now point at this site and the commands are unchanged.
:::

**Related tools**: [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) · [FFmpeg in-browser Runner](https://agicodehub.com/ffmpeg-script-tool)

**Related reading**: [How to Crop and Convert GIFs Using FFmpeg: A Step-by-Step Guide for Content Creators](./how-to-crop-and-convert-gifs-using-ffmpeg.md) · [FFmpeg GIF: Ultimate Guide to Creating and Optimizing GIFs with FFmpeg](./ffmpeg-gif-ultimate-guide.md)

<!-- adapted: agicodehub -->
