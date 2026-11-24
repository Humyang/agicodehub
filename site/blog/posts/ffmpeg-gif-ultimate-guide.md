---
title: "FFmpeg GIF: Ultimate Guide to Creating and Optimizing GIFs with FFmpeg"
date: 2025-03-17
description: "FFmpeg GIF troubleshooting: color banding, dithering, choppy playback, runaway file size and broken loops — with fixes."
tags: [FFmpeg]
legacy_id: 321
legacy_url: "https://www.dve2.com/archives/321/ffmpeg-gif-ultimate-guide-to-creating-and-optimizing-gifs-with-ffmpeg/"
restored_from: wayback
---

# FFmpeg GIF: Ultimate Guide to Creating and Optimizing GIFs with FFmpeg

You already have an `ffmpeg` command that produces a GIF. This note is for when the output is wrong in a specific way: gradients that turn into stripes, dither noise that crawls, playback that hitches, files that balloon, or a loop count that gets ignored. Each section below is a symptom, the cause worth checking first, and the command that fixes it.

## A baseline worth tuning from

```bash
ffmpeg -ss 00:00:02 -t 4 -i input.mp4 \
  -vf "fps=15,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" \
  -loop 0 out.gif
```

`-ss` before `-i` seeks by keyframe and is fast; if the first frame lands late, move `-ss` after `-i` and accept the slower decode. `-t` is a duration, which is less ambiguous than `-to`. `fps` forces a constant frame rate — GIF has no variable timing, so a VFR source gets resampled somewhere, and you want to pick where. The `split` / `palettegen` / `paletteuse` chain is what keeps the file small and the colors sane; encoding without a palette forces a fixed generic one.

## Symptom: visible bands in gradients

**Cause:** a palette holds 256 colors. A smooth sky or a soft shadow needs more levels than that, so the quantizer collapses neighbouring shades into flat steps.

**Fixes, cheapest first:**

- Dither. `paletteuse=dither=bayer:bayer_scale=2` for screen recordings and flat art; `dither=floyd_steinberg` for photographic gradients.
- Per-frame palettes: `[a]palettegen=stats_mode=single[p];[b][p]paletteuse=new=1`. The palette is recomputed every frame. Costs size, removes banding on content that shifts hue as it moves.
- Denoise first: `hqdn3d=2:1:3:2` before `palettegen` so the quantizer spends colors on the gradient instead of on grain.
- Crop the problem out. A banded sky is often cheaper to cut than to fix.

Do not scale up. Upscaling invents interpolated shades the palette never had.

## Symptom: crawling grain and speckle

**Cause:** two things look identical in the output.

1. Error-diffusion dither on moving content — each frame diffuses error differently, so the dots shimmer.
2. A grainy source — noise occupies palette slots and flickers between them.

**Diagnose** by rebuilding the clip with `dither=none`. If the shimmer goes away and banding appears, it was the dither. If the speckle stays, it is the source.

**Fix** by switching to `bayer`, whose pattern moves with the frame instead of crawling, or by denoising with `hqdn3d` (or `atadenoise`) ahead of `palettegen`. The pitfall: the palette must be generated from the same filtered frames that get quantized. Denoise one branch only and the palette no longer matches, which produces fresh speckle. Keep it to one filter chain.

## Symptom: choppy or uneven playback

**Cause:** timing. GIF stores frame delays in centiseconds, so high `fps` values cannot be represented exactly and players round them differently. Second cause: a variable-frame-rate source — screen capture, phone video, most editor exports. Without an explicit `fps`, irregular deltas survive into the GIF and the motion looks jerky.

**Diagnose:**

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=avg_frame_rate,r_frame_rate -of default=nw=1 input.mp4
```

If the two rates differ, the source is VFR.

**Fix** with an explicit `fps=10` to `fps=25`, keep the rate inside what centisecond delays can express, and add `-fps_mode cfr` (older builds: `-vsync cfr`) so the encoder duplicates or drops frames instead of passing irregular timing through. Then reduce dimensions and duration: a wide GIF of a busy scene stutters in a browser from decode cost alone, no matter how correct the timestamps are.

## Symptom: file size out of control

**Cause**, in order of impact: no palette, duration too long, fps too high, width too large, dithering, per-frame palettes. Dither is a real cost — it adds per-pixel entropy that the GIF compressor cannot model away, so a dithered frame compresses worse than a banded one.

**Fix** by cutting in that order. Duration and fps are linear levers; width scales with area. Keep the palette chain. Only after that:

```bash
gifsicle -O3 --lossy=80 out.gif -o out.min.gif
```

`--lossy` trades color precision for bytes, so eyeball the result before shipping it.

## Symptom: the loop is wrong

Three different failures hide behind one complaint.

- **Plays once and stops.** The loop block is missing or was stripped by an editor. Check with `strings out.gif | grep -i netscape` — a `NETSCAPE2.0` block means a count was written. `-loop 0` is forever, `-loop 1` plays twice.
- **Loops forever when you wanted N plays.** `-loop` is an output option and must sit after `-i`. Written before the input it is parsed as an input option and never reaches the muxer.
- **Loop seam hitches.** Usually a duplicated head or tail frame, or a clip that does not end on a clean cut. Drop near-identical frames with `mpdecimate`, or trim the tail with `-t`.

If you would rather see the filter graph assembled than retype it, [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) emits these same two-pass commands with your source path substituted.

---

::: tip About this article
Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; tool links now point at this site and the commands are unchanged.
:::

**Related tools**: [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) · [FFmpeg in-browser Runner](https://agicodehub.com/ffmpeg-script-tool)

**Related reading**: [Optimize GIF Size with FFmpeg: Reduce File Sizes in 3 Steps](./optimize-gif-size-with-ffmpeg.md) · [FFmpeg Crop GIF: A Step-by-Step Guide to Perfectly Trim Your Animations](./ffmpeg-crop-gif-step-by-step-guide.md)

<!-- adapted: agicodehub -->
