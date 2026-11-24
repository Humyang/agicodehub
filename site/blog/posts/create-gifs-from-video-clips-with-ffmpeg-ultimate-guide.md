---
title: "Create GIFs from Video Clips with FFmpeg: Ultimate Guide"
date: 2025-03-16
description: "A four-stage FFmpeg GIF pipeline: frame-accurate trim, lanczos scale, two-pass palettegen, and what -loop 0 actually writes into the file."
tags: [FFmpeg]
legacy_id: 299
legacy_url: "https://www.dve2.com/archives/299/create-gifs-from-video-clips-with-ffmpeg-ultimate-guide/"
restored_from: wayback
---

# Create GIFs from Video Clips with FFmpeg: Ultimate Guide

A GIF is a 256-entry indexed bitmap: no audio, no pixel aspect ratio, delays quantized to 1/100 s. FFmpeg will emit one from a single naive command, and that command is why most hand-made GIFs come out oversized and discoloured. Four stages — trim, scale, palette, loop — exist because the GIF encoder will not do that work for you, and each has a visible failure mode when skipped. Only two encodes happen; the first writes a palette, not a GIF.

## 1. Cut the clip first, from the source

```bash
ffmpeg -ss 00:00:10.5 -to 00:00:13.5 -i source.mp4 \
  -an -c:v ffv1 -level 3 clip.mkv
```

- `-ss` **before** `-i` is an input seek: FFmpeg jumps to the nearest keyframe, decodes forward, discards until the timestamp. On the output side it decodes from frame zero.
- `-to` is an **absolute** timestamp on the source; `-t` is a duration. `-ss 10 -t 3` equals `-ss 10 -to 13`; `-ss 10 -to 3` produces nothing.
- `-c:v ffv1` is lossless, so the frames sampled in stage 4 are bit-identical to the source.
- `-an`: the GIF muxer takes video only and drops audio anyway; this documents intent.

**Skip this and** every experiment re-decodes the whole source, and the palette comes from frames you never ship.

## 2. Pin the frame rate inside the filter chain

`fps=12` belongs in the filter chain, not on the output. GIF stores delays in hundredths of a second and every frame costs bytes, so 30 fps is usually waste. Less obviously: **both passes must sample identical instants.** An output-side `-r 12` resamples per output stream — on a 3-second clip it produced 37 frames where `fps=12` produced 36. Palette built on one grid, frames taken from another, and `paletteuse` is guessing which colour belongs to which pixel.

**Skip this and** file size tracks the source rate, and the two passes quietly disagree.

## 3. Scale with lanczos and kill the SAR

Chain fragment: `scale=480:-2:flags=lanczos,setsar=1`.

- `480` because LZW compresses runs of identical pixels; cost tracks pixel count, so halving each dimension is the biggest lever you have.
- `flags=lanczos` because the bilinear default softens thin lines and invents intermediate colours. Those invented colours then eat palette entries that should have gone to real ones.
- `setsar=1` because anamorphic and DV sources carry a non-1:1 sample aspect ratio, and GIF has nowhere to store one. Every player assumes 1:1 and the clip arrives stretched. It is a no-op on square-pixel sources.
- `-2` rounds the computed height to a multiple of two — irrelevant for GIF, required the moment you reuse the chain for an H.264 output.

**Skip this and** you ship a source-sized file, or a correctly sized one made of mush.

## 4. Two passes, because the encoder cannot look ahead

A GIF frame is indices into a 256-entry table. FFmpeg's `gif` encoder writes them as it goes, so with no palette it falls back to a fixed one — hence gradient banding.

Pass one builds the palette:

```bash
ffmpeg -i clip.mkv \
  -vf "fps=12,scale=480:-2:flags=lanczos,setsar=1,palettegen=stats_mode=diff" \
  -y palette.png
```

`palettegen` must be the last filter; everything before it defines which pixels get sampled. `stats_mode=diff` weights only pixels that change between consecutive frames — right for screen recordings and talking heads over a static background — while `full` (the default) weights every pixel equally.

Pass two maps frames onto it:

```bash
ffmpeg -i clip.mkv -i palette.png \
  -filter_complex "[0:v]fps=12,scale=480:-2:flags=lanczos,setsar=1[v];[v][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -loop 0 -y out.gif
```

The chain before `[v]` is a **verbatim copy** of pass one: same sampling grid, same geometry, exact mapping.

- `dither=bayer:bayer_scale=5` — ordered dithering is deterministic and stable between frames. `floyd_steinberg` looks better on a still and flickers in motion, because error diffusion re-runs per frame.
- `diff_mode=rectangle` — only the changed rectangle of each frame is re-encoded, so a static background collapses.

**Honest note:** the two-pass file is often *larger* than a naive one-pass; dither grain compresses worse than flat bands. You are buying correct colour, and `diff_mode=rectangle` buys part of it back.

**Skip this and** you get banding, wrong skin tones, and a palette spent on colours outside your trimmed interval. Build the palette from `clip.mkv`, never from the full source.

## 5. Loop control

`-loop` is an output option for the GIF muxer. It writes a NETSCAPE2.0 block whose count field is what players read:

- `-loop 0` — infinite, and the default; the block reads `00 00`.
- `-loop -1` — no block is written at all; the file plays once.
- `-loop 3` — writes `00 03`. Decoders disagree on whether that means three plays or four, so treat the value as a hint.

Keep it on the output side. As an input option, `-loop` belongs to the image2 demuxer and means something unrelated.

For a palindrome that loops without a visible jump, reverse and concatenate inside the graph, before the palette pass:

```bash
ffmpeg -ss 00:00:05 -t 2 -i source.mp4 \
  -filter_complex "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,fps=12,scale=480:-2:flags=lanczos,setsar=1,palettegen=stats_mode=diff[v]" \
  -map "[v]" -y boom_palette.png
```

```bash
ffmpeg -ss 00:00:05 -t 2 -i source.mp4 -i boom_palette.png \
  -filter_complex "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,fps=12,scale=480:-2:flags=lanczos,setsar=1[v];[v][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -loop 0 -y boom.gif
```

Same chain in both passes, for the reason given in stage 4. `reverse` buffers every frame in RAM before emitting the first, so keep it short — 2 seconds at 12 fps yields 48 frames.

## 6. Verify the result

```bash
ffprobe -v error -count_frames -select_streams v:0 \
  -show_entries stream=nb_read_frames,width,height -of default=nw=1 out.gif
```

A 3-second clip at `fps=12` must report 36 frames. Off by one and the two passes disagreed on the sampling grid — back to stage 2. If frames and dimensions are right but the file is still too large, change one variable at a time: width to 360, `fps` to 10, or `dither=none` for photographic sources where banding will not show. To assemble the chain from form fields instead of retyping it, the [FFmpeg command workbench](https://agicodehub.com/ffmpeg-workbench) generates both passes.

---

::: tip About this article
Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; tool links now point at this site and the commands are unchanged.
:::

**Related tools**: [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) · [FFmpeg in-browser Runner](https://agicodehub.com/ffmpeg-script-tool)

**Related reading**: [MP4 to GIF FFmpeg: Complete Conversion Guide with Pro Tips](./mp4-to-gif-ffmpeg-complete-conversion-guide.md) · [Optimize GIF Size with FFmpeg: Reduce File Sizes in 3 Steps](./optimize-gif-size-with-ffmpeg.md)

<!-- adapted: agicodehub -->
