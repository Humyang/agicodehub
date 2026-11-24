---
title: "MP4 to GIF FFmpeg: Complete Conversion Guide with Pro Tips"
date: 2025-03-17
description: "Two-pass palettegen/paletteuse, dither modes, and the fps vs scale tradeoff: how each FFmpeg flag buys GIF quality with file size."
tags: [FFmpeg]
legacy_id: 309
legacy_url: "https://www.dve2.com/archives/309/mp4-to-gif-ffmpeg-complete-conversion-guide-with-pro-tips/"
restored_from: wayback
---

# MP4 to GIF FFmpeg: Complete Conversion Guide with Pro Tips

A GIF holds 256 colors per frame, so every mp4→gif decision is a decision about which 256 and how many frames you can afford. This note covers that tradeoff only: why two-pass `palettegen`/`paletteuse` beats a single `-vf` call, what each dither mode costs, and how `fps` and `scale` set the budget before color matters at all. Every command below was run against a real clip.

## The single-pass baseline and where it plateaus

```bash
ffmpeg -y -i input.mp4 -vf "fps=15,scale=640:-1:flags=lanczos" output.gif
```

`fps=15` resamples the timeline, `scale=640:-1` sets the width and derives the height from the aspect ratio, and `flags=lanczos` picks the downscaling kernel (`bicubic` is the default; `neighbor` is right for pixel art and crisp UI captures). The ceiling is in the encoder, not the filter chain: the GIF encoder quantizes each frame into 256 colors against its own generic palette rather than one derived from your clip. Gradients band, dark scenes block up, and no flag on that command fixes it.

## Two passes: measure your own colors first

```bash
ffmpeg -y -i input.mp4 \
  -vf "fps=20,scale=640:-1:flags=lanczos,palettegen=stats_mode=diff" palette.png

ffmpeg -y -i input.mp4 -i palette.png \
  -filter_complex "[0:v]fps=20,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" \
  output.gif
```

Pass one decodes every frame *after* resampling and scaling and writes a 256-entry PNG palette built from the colors that actually occur; pass two re-runs the same chain and quantizes against that palette. The palette is now spent on your footage instead of on colors that never appear in it, which is why gradients hold and a logo or skin tone stays stable from frame to frame.

`stats_mode` controls what gets counted:

- `full` — every pixel of every frame, equally weighted. Neutral default for heavy motion.
- `diff` — weights pixels that differ from the previous frame, so the palette follows the subject rather than the backdrop. Better for screen recordings.
- `single` — one palette per frame, written as an image sequence (`palette-%03d.png`) and consumed with `paletteuse=new=1`. Highest fidelity, most work; the sequence must line up frame-for-frame.

Pitfalls specific to the pair:

- **The two chains must be identical.** If pass two scales to 640 and pass one to 480, the palette describes colors that never reach the output.
- **Trimming must match too.** Put `-ss`/`-t` before `-i` in both commands, or the palette is built from footage you never export.
- **You pay a second decode.** On a long mp4, trim first and run both passes on the short segment.

## Dither: the size knob most people never touch

Quantization still has to map colors it just discarded onto something.

- `dither=none` — direct nearest-color mapping. Smallest output, visible banding on any gradient. Acceptable for flat-color screencasts.
- `dither=bayer` — ordered dithering, with `bayer_scale=0..5` (default `2`) setting how coarse the pattern is. Deterministic, so a flat region produces the same pixels in every frame and stays cheap to store.
- `dither=sierra2_4a` — light error diffusion. The sane default when you want smooth gradients without the full cost.
- `dither=floyd_steinberg` — heavy error diffusion. Best gradients, at the price of per-pixel noise scattered across every frame. GIF compresses runs of identical pixels, and that noise is exactly what blocks compression: bigger files plus static areas that shimmer as the noise re-rolls.

`diff_mode=rectangle` re-quantizes only the rectangle that changed since the previous frame; everything else keeps its old values. That is what makes a mostly static clip compress, and why `bayer` pairs nicely with a fixed background while `diff_mode=none` re-dithers the whole frame and throws the gain away.

## fps: prefer divisors of 100

GIF stores frame delays in hundredths of a second, so only some rates land on a uniform cadence:

```bash
ffmpeg -y -i input.mp4 -vf "fps=20,scale=640:-1:flags=lanczos" fps20.gif
ffmpeg -y -i input.mp4 -vf "fps=12.5,scale=640:-1:flags=lanczos" fps125.gif
ffmpeg -y -i input.mp4 -vf "fps=15,scale=640:-1:flags=lanczos" fps15.gif

ffprobe -v error -select_streams v:0 -show_entries frame=pkt_duration_time -of csv=p=0 fps20.gif | head -3
```

The first two report a flat `0.050000` and `0.080000` — one delay for every frame. The `fps=15` file alternates `0.060000`/`0.070000`: that rate cannot be expressed in hundredths, so the cadence jitters frame by frame, which reads as uneven stepping on a slow pan. Pick `10`, `12.5`, `20`, `25` or `50` when smoothness matters.

Frame count scales with `fps` — the second-strongest lever after duration — and browsers commonly clamp very short delays, so pushing past 25 spends frames nobody sees. Cutting a second off the clip beats halving the frame rate almost every time.

## scale: judge it at display size

Width dominates the file, but it also keeps text readable. Pick the width the GIF is actually rendered at, not the source width, and never upscale. For code and UI recordings prefer `flags=neighbor`; lanczos turns glyph edges to mush. Use `-2` instead of `-1` only when the pixel format needs even dimensions — the GIF encoder does not, so `-1` is fine.

## Putting it together

```bash
ffmpeg -y -ss 00:00:03 -t 4 -i input.mp4 \
  -vf "fps=20,scale=640:-1:flags=lanczos,palettegen=stats_mode=diff" palette.png

ffmpeg -y -ss 00:00:03 -t 4 -i input.mp4 -i palette.png \
  -filter_complex "[0:v]fps=20,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" \
  output.gif

ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,avg_frame_rate,nb_frames \
  -of default=nw=1 output.gif
```

The `ffprobe` line is what people skip: it confirms width, exact frame rate, and frame count. When the file still needs to shrink without touching resolution, lower `palettegen=max_colors` first — coarser color is usually the cheaper trade than fewer frames.

If you would rather not keep the two filter chains in sync by hand, the [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) generates both passes from one set of parameters.

---

::: tip About this article
Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; tool links now point at this site and the commands are unchanged.
:::

**Related tools**: [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) · [FFmpeg in-browser Runner](https://agicodehub.com/ffmpeg-script-tool)

**Related reading**: [Optimize GIF Size with FFmpeg: Reduce File Sizes in 3 Steps](./optimize-gif-size-with-ffmpeg.md) · [FFmpeg MP4 to GIF: Convert Videos to Animated Images Easily](./ffmpeg-mp4-to-gif-convert-videos-to-animated-images.md)

<!-- adapted: agicodehub -->
