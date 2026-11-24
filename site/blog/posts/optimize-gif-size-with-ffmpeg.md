---
title: "Optimize GIF Size with FFmpeg: Reduce File Sizes in 3 Steps"
date: 2025-03-17
description: "FFmpeg GIF size control in three levers: palette quantization to 128/64 colours, lower fps and scale, dropped duplicate frames — and what each costs."
tags: [FFmpeg]
legacy_id: 311
legacy_url: "https://www.dve2.com/archives/311/optimize-gif-size-with-ffmpeg-reduce-file-sizes-in-3-steps/"
restored_from: wayback
---

# Optimize GIF Size with FFmpeg: Reduce File Sizes in 3 Steps

A GIF that looks fine locally can ship several megabytes, because the format has no inter-frame motion compensation and stores an indexed colour table per frame. FFmpeg gives you exactly three levers over that: colour depth, pixel throughput, and redundant frames. Each fails differently and visibly, so below they are ordered by how predictable the damage is.

## Why size explodes

GIF allows 256 colours per frame, so full-colour footage is dithered down to a palette, and that dither noise is what defeats compression. There is also no temporal prediction: a 30 fps clip of a static screen still pays for 30 indexed bitmaps per second. Every step below attacks one of those two costs.

## Step 1: Quantize the palette (256 → 128 or 64)

Two passes. The first measures the clip and writes a palette PNG; the second applies it.

```bash
ffmpeg -i input.gif -vf "palettegen=max_colors=128:stats_mode=diff" palette.png
ffmpeg -i input.gif -i palette.png -lavfi "paletteuse=dither=sierra2_4a" output.gif
```

`max_colors` sets the palette size — 128 and 64 are the useful stops below the format maximum. `stats_mode=diff` weights the histogram toward pixels that change between frames, which suits animation rather than a still. On the `paletteuse` side, `dither=sierra2_4a` is a sane error-diffusion default; `dither=bayer:bayer_scale=3` produces a coarser cross-hatch that often compresses better, at the cost of visible texture.

**Cost:** below 128 colours, smooth gradients break into bands. Skin tones, skies, and soft shadow falloff go first. 64 colours is fine for line art, UI screenshots, terminal captures, flat vector illustration — wrong for photographic footage. Check whether your build exposes the gif encoder's lossy mode before counting on it:

```bash
ffmpeg -h encoder=gif | grep -i lossy
```

If `-lossy` appears, adding it to the `paletteuse` pass lets the encoder skip small colour-table changes. Treat it as a stretch goal after the palette pass is dialled in.

## Step 2: Lower the frame rate and scale down

Cheaper per byte than colour reduction, and more brutal, because it changes what the viewer can read.

```bash
ffmpeg -i input.gif -vf "fps=12,scale=480:-2:flags=lanczos,palettegen=max_colors=128" palette.png
ffmpeg -i input.gif -i palette.png -lavfi "fps=12,scale=480:-2:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a" output.gif
```

Both passes need an identical chain, or the palette is measured on frames the second pass never emits. `scale=480:-2` pins width and lets FFmpeg derive height; `-2` rather than `-1` rounds to an even number and avoids surprises when the file is re-encoded later. `flags=lanczos` is sharper than the default bilinear on downscale, worth it for text.

**Cost:** 12 fps reads as deliberate and slightly choppy; talking heads and slow scrolling survive it, fast cursor work and gameplay do not. On resolution the real limit is legibility, not taste — a screencast with 11-pixel UI text dies somewhere around half its native width. Sample one frame at the target size before batching.

## Step 3: Drop redundant frames

Screen recordings and slide animations spend most frames showing nothing new. `mpdecimate` measures inter-frame difference and lets identical frames fall out:

```bash
# FFmpeg 5.1 及以上
ffmpeg -i input.gif -vf "mpdecimate=hi=64*12:lo=64*5:frac=0.33,setpts=N/FRAME_RATE/TB" -fps_mode vfr output.gif
# 5.1 之前（4.x 系列）没有 -fps_mode，同一个开关叫 -vsync
ffmpeg -i input.gif -vf "mpdecimate=hi=64*12:lo=64*5:frac=0.33,setpts=N/FRAME_RATE/TB" -vsync vfr output.gif
```

`hi` and `lo` are per-block difference thresholds on an 8×8 block scale, and `frac` is the share of blocks that must exceed `lo` before a frame is kept. `setpts=N/FRAME_RATE/TB` rewrites timestamps so survivors play contiguously; without it the GIF keeps the original gaps and stutters through long holds.

**Cost:** the filter is threshold-based, so it eventually eats frames that carry motion. Raise `frac` to be more aggressive, lower it to be conservative, and re-watch the fastest-moving segment after every change. Note `-fps_mode vfr` (older builds spell it `-vsync vfr`): the gif muxer stores per-frame delays, so genuinely dropped frames shrink the file, while forcing a constant rate re-duplicates them and hands the bytes back. On a GIF already optimised elsewhere this step does almost nothing — there is nothing left to remove.

## Order of operations

Geometry and time first, colour last. Settle `fps`, `scale`, and `mpdecimate` in a throwaway encode, then run the two-pass palette against that final frame stream. Quantising first and rescaling afterwards spends the palette on pixels you are about to discard.

## Checking the result

```bash
ls -lh input.gif output.gif
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of default=nw=1 output.gif
```

Compare the two files at 100% zoom, not in a viewer that scales to fit — banding and dither texture only show at native size. When a batch needs the same chain repeatedly, the [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) assembles these filter graphs for you.

---

::: tip About this article
Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; tool links now point at this site and the commands are unchanged.
:::

**Related tools**: [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) · [FFmpeg in-browser Runner](https://agicodehub.com/ffmpeg-script-tool)

**Related reading**: [FFmpeg GIF: Ultimate Guide to Creating and Optimizing GIFs with FFmpeg](./ffmpeg-gif-ultimate-guide.md) · [Create GIFs from Video Clips with FFmpeg: Ultimate Guide](./create-gifs-from-video-clips-with-ffmpeg-ultimate-guide.md)

<!-- adapted: agicodehub -->
