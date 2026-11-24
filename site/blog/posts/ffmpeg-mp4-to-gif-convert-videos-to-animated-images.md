---
title: "FFmpeg MP4 to GIF: Convert Videos to Animated Images Easily"
date: 2025-03-17
description: "The four defaults `ffmpeg -i in.mp4 out.gif` gets wrong — built-in palette, runaway size, the loop flag, full length — and the smallest fix for each."
tags: [FFmpeg]
legacy_id: 315
legacy_url: "https://www.dve2.com/archives/315/ffmpeg-mp4-to-gif-convert-videos-to-animated-images-easily/"
restored_from: wayback
---

# FFmpeg MP4 to GIF: Convert Videos to Animated Images Easily

`ffmpeg -i input.mp4 output.gif` exits 0, writes a file, and is wrong in four separate ways: the colors are quantised against a palette that has nothing to do with your footage, the file is far bigger than it needs to be, the loop metadata is whatever the muxer happens to default to, and you just converted the entire clip. This note covers only those four defaults, one minimal command change each, in the order that keeps every later step cheap.

## 1. Dirty colors: the encoder picks its own palette

A GIF frame is a set of indices into a table of at most 256 colors. Left alone, the `gif` encoder quantises your frames against a fixed built-in palette instead of one derived from the video, so skin tones, gradients and dark scenes collapse onto the nearest entry it has.

Build the palette from the clip itself:

```bash
ffmpeg -i input.mp4 -filter_complex \
  "[0:v]fps=12,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" \
  output.gif
```

`palettegen` scans the frames and emits a 256-entry palette; `paletteuse` maps each frame onto it. `split` hands the same filtered stream to both, which is why the single-command form is the one to prefer — it cannot drift.

The two-pass equivalent, when you want the palette on disk for reuse:

```bash
ffmpeg -i input.mp4 -vf "fps=12,scale=640:-1:flags=lanczos,palettegen" palette.png
ffmpeg -i input.mp4 -i palette.png -filter_complex \
  "[0:v]fps=12,scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse" output.gif
```

**Pitfall:** both passes must use identical `fps` and `scale`. Change the scale in pass two only and `paletteuse` maps a different frame set onto the palette, and the banding comes back. `scale=640:-1` preserves aspect ratio; odd heights are legal in GIF, so `-1` is fine here (unlike x264, which needs `-2`).

## 2. Size explosion: every frame is a full-size bitmap

GIF has no inter-frame prediction to speak of — LZW compresses flat areas and nothing else. At source resolution and 30 fps you are storing roughly everything, so the file grows with area × frames.

The `fps` and `scale` in the command above already do most of the work. When it is still too large, in order of usefulness:

- `paletteuse=dither=bayer:bayer_scale=3` — bayer dithering is regular noise, which LZW compresses much better than the default error-diffusion (`sierra2_4a`); raise `bayer_scale` to trade visible dither texture for bytes.
- `paletteuse=dither=none` — smallest output, but smooth gradients become visible bands. Check real frames before shipping it.
- `paletteuse=diff_mode=rectangle` — writes only the changed rectangle per frame.
- `palettegen=max_colors=128` — halves the table; fine for UI screencasts, poor for photographic footage.

```bash
ffmpeg -i input.mp4 -filter_complex \
  "[0:v]fps=12,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
  output.gif
```

**Pitfall, timing:** GIF stores frame delay in centiseconds, so only frame rates that divide 100 land exactly. `fps=12` is written as 8 cs and plays at 12.5 fps; `fps=10`, `20`, `25`, `50` are exact. If the clip has to feel like the original, pick one of those.

## 3. The loop flag: wrong object, wrong place, wrong value

`-loop` belongs to the **gif muxer**, not to the encoder or the filter graph, so it goes after the inputs and before the output filename. Put it in front of `-i` and ffmpeg stops with `Option loop not found` — the mp4 demuxer has no such option, so the build fails outright rather than ignoring you.

Values: `-loop 0` means infinite (and is the muxer default), `-loop -1` writes no loop block at all so the file plays once, `-loop N` repeats N extra times.

```bash
# loop forever (-loop 0 is the muxer default; stating it is documentation)
ffmpeg -i input.mp4 -filter_complex \
  "[0:v]fps=12,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" \
  -loop 0 output.gif

# play exactly once
ffmpeg -i input.mp4 -filter_complex \
  "[0:v]fps=12,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" \
  -loop -1 output.gif
```

**Pitfall:** if a GIF plays exactly once, the loop block is either absent or set to `-1`. Check the file rather than the command:

```bash
grep -c NETSCAPE2.0 output.gif   # 1 = loop block present, 0 = single play
```

`-final_delay` (centiseconds, default `-1`) sets the hold after the last frame, which is what you tune when the restart feels abrupt.

## 4. Whole-clip length: trim as an input option

`-ss` and `-t` placed **before** `-i` act on the input: `-ss` seeks the demuxer, `-t` limits how much is read. Placed after `-i` they act on the output, and ffmpeg decodes everything up to that point and discards it. Same result, different cost.

```bash
ffmpeg -ss 00:00:12 -t 4 -i input.mp4 -filter_complex \
  "[0:v]fps=12,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" \
  -loop 0 output.gif
```

**Pitfall:** in the two-pass form, trim in *both* commands. A trimmed palette pass paired with an untrimmed encode pass is the classic mismatch — palette built from frames the second pass never sees, and the encode still takes as long as the full clip. A short loop that returns cleanly to its own first frame reads as continuous far better than a long excerpt with a visible jump at the wrap.

## Order of operations

Trim first, then `fps` and `scale`, then the palette, then the loop flag. Each step shrinks the input to the next one, so fixing length before fixing size before fixing palette is both the fastest route and the one that avoids rebuilding a palette you then throw away. If assembling the filter graph is the annoying part, the [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) generates the `fps`/`scale`/`palettegen` arguments from a form.

---

::: tip About this article
Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; tool links now point at this site and the commands are unchanged.
:::

**Related tools**: [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) · [FFmpeg in-browser Runner](https://agicodehub.com/ffmpeg-script-tool)

**Related reading**: [MP4 to GIF FFmpeg: Complete Conversion Guide with Pro Tips](./mp4-to-gif-ffmpeg-complete-conversion-guide.md) · [Convert Video to GIF Command Line: Master FFmpeg for Efficient Conversions](./convert-video-to-gif-command-line.md)

<!-- adapted: agicodehub -->
