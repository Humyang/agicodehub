---
title: "Create GIFs from Video Clips with FFmpeg: Ultimate Conversion Guide"
date: 2025-03-17
description: "Nine copy-paste FFmpeg recipes for video to GIF: palette passes, exact trims, speed changes, square crops, boomerangs, captions, and size caps."
tags: [FFmpeg]
legacy_id: 319
legacy_url: "https://www.dve2.com/archives/319/create-gifs-from-video-clips-with-ffmpeg-ultimate-conversion-guide-2/"
restored_from: wayback
---

# Create GIFs from Video Clips with FFmpeg: Ultimate Conversion Guide

You have a clip and you need a GIF: a bug repro, a build log that scrolled past too fast, a two-second before/after. This is the cheat sheet I keep one tab away — nine commands, one per job, each with the flags that matter and the ones that bite. All assume `input.mp4` and write one GIF; swap names and timestamps.

Two rules recur below: filters that change timing or size (`setpts`, `crop`, `scale`, `fps`) go **before** `split`, since `palettegen` reads the frames you keep; and `-ss` goes before `-i`, so FFmpeg seeks rather than decoding from zero.

## 1. The default: short clip, palette inline

Reach for this first — any source, three seconds, 480px wide, palette built in the same pass so colors never shift mid-animation.

```bash
ffmpeg -ss 00:00:10 -t 3 -i input.mp4 -vf "fps=12,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" -loop 0 out.gif
```

- `fps=12` frames per second, `scale=480:-1` width 480 with proportional height, `-t 3` duration.
- `-loop 0` loops forever; `-loop -1` plays once.
- `split` is not optional: `palettegen` consumes its input, leaving nothing for the second branch.
- `dither=bayer` keeps color steady; `diff_mode=rectangle` rewrites only changed regions, so files stay smaller.

## 2. Two passes, palette reused across a series

Cutting many GIFs from one recording? Build the palette once and feed it to every cut — same colors, one pass per clip.

```bash
ffmpeg -ss 00:00:10 -t 3 -i input.mp4 -vf "fps=12,scale=480:-1:flags=lanczos,palettegen=stats_mode=diff" palette.png
ffmpeg -ss 00:00:40 -t 4 -i input.mp4 -i palette.png -filter_complex "[0:v]fps=12,scale=480:-1:flags=lanczos[v];[v][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" -loop 0 clip-b.gif
```

- The palette file is a tiny PNG, one row per color; keep it next to the clips.
- Build the palette at the same `fps` and `scale` you output, or you pick colors for frames you discard.
- The second pass uses `-filter_complex` only — also passing `-vf` to the same output is rejected.

## 3. Exact interval, plays once

For docs and bug reports, where the first frame matters and looping is wrong.

```bash
ffmpeg -ss 00:01:03 -to 00:01:06 -i input.mp4 -vf "fps=10,scale=640:-1,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop -1 out.gif
```

- `-ss` start, `-to` end on the source timeline; `-t` is a duration — use one or the other.
- `-loop -1` writes no loop block at all (play once), `-loop 0` loops forever, and a positive value stores that repeat count.
- If a clip starts at a non-zero timestamp (some phone and screen-recorder output), move `-ss` after `-i`; the run gets slower.

## 4. Speed up or slow down

Build logs, typing demos, and animations that drag.

```bash
ffmpeg -ss 00:00:04 -t 6 -i input.mp4 -vf "setpts=0.5*PTS,fps=15,scale=480:-1,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop 0 fast.gif
```

- `setpts=0.5*PTS` doubles speed; `2*PTS` halves it; `0.25*PTS` is four times.
- `fps` must come after `setpts`, otherwise you resample the old timing.
- Speeding up discards frames: a 30fps source at 2× keeps one in two, so fast motion gets jumpy.

## 5. Center square crop

Chat clients and social previews crop to a square anyway; do it yourself to pick the framing.

```bash
ffmpeg -ss 00:00:12 -t 3 -i input.mp4 -vf "crop=ih:ih,fps=12,scale=400:-1,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop 0 square.gif
```

- `crop=ih:ih` squares the frame at source height and centers by default, so no `x`/`y` needed; for an off-center subject pass `crop=ih:ih:X:Y`. It must run before `scale`.

## 6. Boomerang (forward, then back)

For a moment that reads better played both ways.

```bash
ffmpeg -ss 00:00:08 -t 2 -i input.mp4 -filter_complex "[0:v]fps=12,scale=480:-1,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[cat];[cat]split[c][d];[c]palettegen[p];[d][p]paletteuse" -loop 0 boom.gif
```

- `reverse` buffers the whole clip in memory, so keep the segment short.
- `concat=n=2:v=1` needs both branches at the same size and frame rate — hence `fps` and `scale` first.
- Output runs twice the trimmed length; audio is dropped.

## 7. Burned-in caption

A label on the frame when you are not burning subtitles, or your build lacks the `subtitles` filter.

```bash
ffmpeg -ss 00:00:06 -t 3 -i input.mp4 -vf "fps=12,scale=480:-1,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='build passes':fontsize=28:fontcolor=white:box=1:boxcolor=black@0.6:x=(w-text_w)/2:y=h-th-20,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop 0 caption.gif
```

- Pass `fontfile` explicitly; without fontconfig, `drawtext` exits with "No font filename provided".
- `x=(w-text_w)/2:y=h-th-20` centers horizontally, 20px above the bottom; `box=1` adds a readable backing.
- Escape commas and colons inside `text` (`,` and `:`); keep `drawtext` before `split`.

## 8. Smallest useful file

When there is a hard ceiling — a chat upload limit, a README — shrink deliberately.

```bash
ffmpeg -ss 00:00:14 -t 2 -i input.mp4 -vf "fps=10,scale=280:-1,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none" -loop 0 tiny.gif
```

- `max_colors=64` cuts palette depth, `dither=none` drops dither noise; both shrink the file.
- `stats_mode=diff` builds the palette from pixels that change between frames — good for small text on a static background.
- Gradients band. Shave length, then width, then `fps`, then colors — that order stays legible longest. Screen recordings: `flags=neighbor` on `scale` keeps pixels crisp.

## 9. Batch a folder

Same recipe over every clip in a directory — cut lists, asset regeneration.

```bash
mkdir -p out
for f in clips/*.mp4; do
  n=$(basename "$f" .mp4)
  ffmpeg -y -loglevel error -ss 5 -t 2 -i "$f" \
    -vf "fps=12,scale=400:-1,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse" \
    -loop 0 "out/$n.gif"
done
```

- `-y` because a batch run cannot answer the overwrite prompt.
- Keep `"$f"` quoted; spaces in filenames cause half-finished batches.
- `-loglevel error` keeps the console readable; then check exit codes, since silence stops being a success signal.

Retyping these is the annoying part; the generator at [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) emits the same flag strings from form fields.

---

::: tip About this article
Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; tool links now point at this site and the commands are unchanged.
:::

**Related tools**: [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) · [FFmpeg in-browser Runner](https://agicodehub.com/ffmpeg-script-tool)

**Related reading**: [Create GIFs from Video Clips with FFmpeg: Ultimate Guide](./create-gifs-from-video-clips-with-ffmpeg-ultimate-guide.md) · [FFmpeg GIF: Ultimate Guide to Creating and Optimizing GIFs with FFmpeg](./ffmpeg-gif-ultimate-guide.md)

<!-- adapted: agicodehub -->
