---
title: "How to Crop and Convert GIFs Using FFmpeg: A Step-by-Step Guide for Content Creators"
date: 2025-02-21
description: "One worked example: crop a 500×500 GIF to 300×300 with FFmpeg, rebuild it with a custom palette, and check each intermediate before shipping it."
tags: [FFmpeg]
legacy_id: 33
legacy_url: "https://www.dve2.com/archives/33/how-to-crop-and-convert-gifs-using-ffmpeg-a-step-by-step-guide-for-content-creators/"
restored_from: wayback
---

# How to Crop and Convert GIFs Using FFmpeg: A Step-by-Step Guide for Content Creators

You have a 500×500 GIF and you need a 300×300 version that is small enough to drop into a page. Cropping alone does not get you there: FFmpeg re-encodes the animation, the default palette is usually bad, and the file can come out larger than the input. This note walks one case end to end — source at `input.gif`, target 300×300, shipped file under a size budget you set yourself — and says what to look at after every command.

## Step 0: measure the input

Never crop blind. Ask FFmpeg what you actually have:

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,nb_frames \
  -of default=noprint_wrappers=1 input.gif
```

`width`/`height` are the frame canvas, `r_frame_rate` is the nominal rate, `nb_frames` is the count the demuxer reports. For GIFs that last field can disagree with what a browser plays, so confirm it with a real count when the number matters:

```bash
ffprobe -v error -count_frames -select_streams v:0 \
  -show_entries stream=nb_read_frames -of csv=p=0 input.gif
```

Then look at the file size and at the animation itself: a 500×500 GIF is often a crop of something wider, with dead space around the subject.

## Step 1: crop to 300×300

`crop` takes `w:h:x:y`, where `x`/`y` is the offset of the crop box from the top-left corner:

```bash
ffmpeg -i input.gif -vf "crop=300:300:100:100" -y cropped.gif
```

The constraint the filter enforces is `x + w <= input width` and `y + h <= input height`. With a 500×500 source and a 300×300 box, `x` and `y` can each be anything from 0 to 200. `100:100` centres the box; use `0:0` for top-left, `200:200` for bottom-right, and pick something in between if your subject sits off-centre.

Two things to check before moving on:

- Dimensions of the result are what you asked for, not silently rounded.
- The crop did not clip the subject. Open `cropped.gif` and look at the first and last frames, not just the middle one — animated subjects drift.

Cropping alone rarely shrinks the file much, and here is the trap: this command already re-encoded the GIF once, with FFmpeg's default palette handling. If the colours look worse than the input, that is this step, not the next one.

## Step 2: rebuild with a palette

GIF is limited to a 256-entry palette per frame context, so a single global palette derived from your specific clip beats whatever the encoder guesses. The reliable pattern is two passes: generate a palette, then apply it.

```bash
ffmpeg -i cropped.gif -vf "fps=12,scale=300:300:flags=lanczos,palettegen=stats_mode=diff" -y palette.png
```

```bash
ffmpeg -i cropped.gif -i palette.png \
  -lavfi "fps=12,scale=300:300:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" \
  -loop 0 -y out.gif
```

Parameters that matter:

- `fps=12` drops frames to 12 per second. This is the single biggest lever on file size and the one that visibly damages the animation if you push it too low. Use it in both passes so the palette is built from the frames you will encode.
- `scale=300:300` is redundant after cropping to 300×300 — keep it only if you plan to resize.
- `flags=lanczos` is the resampling filter; a safe default for downscaling.
- `palettegen=stats_mode=diff` builds the palette from the parts of the frame that change, which suits animations with a static background. `stats_mode=full` weights the whole frame.
- `paletteuse=dither=bayer:bayer_scale=3` uses ordered dithering. Lower `bayer_scale` dithers more aggressively (visible pattern, smoother gradients); `dither=none` gives flat bands and the smallest file. Diffusion dithering suits photos but adds noise, and noise costs bytes.
- `-loop 0` means loop forever. `-loop 1` plays once.

If size is still over budget, cut colours before cutting frames:

```bash
ffmpeg -i cropped.gif -vf "fps=12,palettegen=max_colors=64:stats_mode=diff" -y palette.png
```

## Step 3: verify the output

Check the size and the structure of the result rather than trusting the log:

```bash
ls -lh out.gif
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate -of default=noprint_wrappers=1 out.gif
```

Then watch it: full loop, on the background colour it will actually sit on. Palette damage shows up as banding in gradients and as a halo around moving edges; frame drops show up as stutter. If the palette pass made things worse than `cropped.gif`, the usual causes are a palette generated from the pre-`fps` stream, or dithering that is too coarse for the content.

## Step 4: only now trim, if you need to

If the budget still does not fit, remove time instead of quality. Put `-ss` and `-t` before `-i` for a fast seek, or after `-i` for an accurate one:

```bash
ffmpeg -ss 1.5 -t 3 -i input.gif -vf "fps=12,crop=300:300:100:100,palettegen=stats_mode=diff" -y palette.png
```

Combine crop, `fps`, and palette generation into one filter chain like that once you know the values you want — it saves a re-encode generation and the quality loss that comes with it. Keep the two-pass structure; do not try to collapse `palettegen` and `paletteuse` into a single command.

## What usually goes wrong

- **Output larger than input.** The source was already optimised, or you raised the frame rate, or diffusion dithering was added on flat artwork.
- **Colours shifted.** The palette was built from a different filter chain than the one used to encode. The two pass commands must be identical up to `palettegen`.
- **Crop offset out of range.** `x + w` exceeding the source width makes `crop` fail or clamp; re-check with `ffprobe` instead of guessing.
- **A single frame left after processing.** Some GIFs carry a per-frame delay of zero; adding `fps=` normalises timing, but a source with one real frame cannot be turned into an animation.
- **Repeated lossy passes.** Each `ffmpeg -i x.gif out.gif` throws away palette information. Always re-run from the original source, not from an intermediate.

If you would rather assemble the filter chain from a form and then read the command it produces, the [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) builds these invocations for crop, split, and GIF conversion; run the output locally so you can inspect each intermediate as described above.

---

::: tip About this article
Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; tool links now point at this site and the commands are unchanged.
:::

**Related tools**: [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) · [FFmpeg in-browser Runner](https://agicodehub.com/ffmpeg-script-tool)

**Related reading**: [FFmpeg Crop GIF: A Step-by-Step Guide to Perfectly Trim Your Animations](./ffmpeg-crop-gif-step-by-step-guide.md) · [Create GIFs from Video Clips with FFmpeg: Ultimate Guide](./create-gifs-from-video-clips-with-ffmpeg-ultimate-guide.md)

<!-- adapted: agicodehub -->
