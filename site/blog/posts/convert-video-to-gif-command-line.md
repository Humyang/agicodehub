---
title: "Convert Video to GIF Command Line: Master FFmpeg for Efficient Conversions"
date: 2025-03-17
description: "Batch video-to-GIF conversion on the command line: parameterized filter chains, a filename-safe loop, failure retries, and per-file logs."
tags: [FFmpeg]
legacy_id: 317
legacy_url: "https://www.dve2.com/archives/317/convert-video-to-gif-command-line-master-ffmpeg-for-efficient-conversions/"
restored_from: wayback
---

# Convert Video to GIF Command Line: Master FFmpeg for Efficient Conversions

One GIF is a single `ffmpeg` line. Forty GIFs from forty screen recordings is a different problem: every clip needs its own trim window, a failed run leaves you with no idea which clip broke, and a half-written output looks like a finished one. This note is about the second case — wrapping the conversion in variables, a loop, and a log so the whole batch is repeatable and you can rerun only what failed.

## Parameterize the filter chain first

Start by moving every value you would otherwise retype into variables. Frames per second, output width, and the trim window are the three that change per project.

```bash
IN=input.mp4
OUT=out.gif
FPS=12          # frames per second; lower = smaller file
WIDTH=480       # output width in px; height follows the source ratio
START=00:00:04  # trim in-point
DUR=6           # seconds to keep
```

Then build the filter chain from those variables rather than pasting a fixed string:

```bash
VF="fps=${FPS},scale=${WIDTH}:-1:flags=lanczos"
```

Two rules for this string. Use `${WIDTH}:-1` so the height is computed from the source aspect ratio instead of being forced, and set `-1` rather than `-2` only when the scaled height is even for your encoder — if `ffmpeg` refuses an odd height later, switch to `-2`. Keep the whole chain in one variable so the palette pass and the encode pass cannot drift apart; a mismatched `fps` between the two passes produces a GIF whose timing disagrees with the palette.

## Two passes, and why the first one is cheap

A single-pass `ffmpeg -i input.mp4 output.gif` works, but GIF is limited to a 256-color palette and the default quantization bands gradients badly. The two-pass form builds a palette from the clip and then applies it:

```bash
ffmpeg -y -ss "$START" -t "$DUR" -i "$IN" \
  -vf "${VF},palettegen=stats_mode=diff" -frames:v 1 palette.png

ffmpeg -y -ss "$START" -t "$DUR" -i "$IN" -i palette.png \
  -filter_complex "[0:v]${VF}[x];[x][1:v]paletteuse=dither=bayer" \
  -loop 0 "$OUT"
```

`-ss` before `-i` seeks before decoding, so it is fast on long files; if a frame lands in the wrong place, move `-ss` after `-i` for frame-accurate (and slower) seeking. `-frames:v 1` keeps the palette pass from writing more than one image. `stats_mode=diff` in `palettegen` weights pixels that change between frames, which suits clips with a static background and one moving region.

The catch: the palette comes from the frames in your trim window. Palette for a 5-second window and reuse it on a 40-second one and the later colors are missing — the palette is still valid, just less accurate. Either regenerate per clip or use a deliberately wide sample when batching clips from the same source.

## Loop over a directory without losing filenames

`for file in *.mp4` breaks on spaces and on nested directories, and it silently skips to the next file when one fails. Use `find` with a null delimiter and a `while read` loop:

```bash
SRC=./clips
DST=./gif-out
mkdir -p "$DST" .ffmpeg-logs

find "$SRC" -type f -name '*.mp4' -print0 |
while IFS= read -r -d '' file; do
  base=$(basename "$file" .mp4)
  out="$DST/${base}.gif"

  # resume: skip anything already converted
  if [ -s "$out" ]; then
    printf 'skip  %s\n' "$base"
    continue
  fi

  ffmpeg -nostdin -y -loglevel error \
    -ss "$START" -t "$DUR" -i "$file" \
    -vf "${VF},palettegen=stats_mode=diff" -frames:v 1 ".ffmpeg-logs/${base}.pal.png"

  ffmpeg -nostdin -y -loglevel error \
    -ss "$START" -t "$DUR" -i "$file" -i ".ffmpeg-logs/${base}.pal.png" \
    -filter_complex "[0:v]${VF}[x];[x][1:v]paletteuse=dither=bayer" \
    -loop 0 "$out" > ".ffmpeg-logs/${base}.log" 2>&1

  if [ $? -eq 0 ] && [ -s "$out" ]; then
    printf 'ok    %s\n' "$base"
  else
    printf 'FAIL  %s\n' "$base"
    printf '%s\n' "$base" >> .ffmpeg-logs/failed.txt
  fi
done
```

`-print0` plus `IFS= read -r -d ''` is the part that matters: it survives spaces, quotes, and unicode in filenames, none of which `for file in *` handles. `-nostdin` stops the first `ffmpeg` from eating the loop's stdin, a classic cause of a batch that converts one file and stops.

The `[ -s "$out" ]` check is a resume marker, not just a success test. Keep it and a rerun costs seconds; drop it and every rerun re-encodes everything from scratch.

## Failures, logs, and the rerun

`ffmpeg` exit codes are your primary signal: `0` for success, non-zero for a decode/encode error. But a zero-byte or truncated GIF can also survive a killed process, which is why the check above tests both the exit code and the file size. Failed names go into `.ffmpeg-logs/failed.txt`, and the rerun is just that list:

```bash
while IFS= read -r base; do
  ffmpeg -nostdin -y -loglevel error \
    -i "$SRC/${base}.mp4" -i ".ffmpeg-logs/${base}.pal.png" \
    -filter_complex "[0:v]${VF}[x];[x][1:v]paletteuse=dither=bayer" \
    -loop 0 "$DST/${base}.gif" >> ".ffmpeg-logs/${base}.log" 2>&1 || \
    printf 'still failing: %s (see .ffmpeg-logs/%s.log)\n' "$base" "$base"
done < .ffmpeg-logs/failed.txt
```

Clear `failed.txt` before a fresh full run so old failures do not get retried forever.

Practical notes before you wire this into CI:

- **Disk usage** — the palette pass writes one file per clip; they accumulate. Delete `.ffmpeg-logs/*.pal.png` at the start of a full run if disk is tight, then regenerate.
- **`-y` is not optional here** — without it, `ffmpeg` prompts for overwrite confirmation and a non-interactive job hangs until timeout.
- **Silence is a bug** — `-loglevel error` keeps the console readable, but redirect stderr per file anyway. A GIF that "converted fine" and looks wrong needs that log.
- **Check one output by eye** — palette statistics, `dither`, and odd `-ss` placement all fail quietly rather than loudly. Convert a single clip, open it, then run the batch.

If you would rather generate the parameter block than retype it, [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) renders the same two-pass command from a form, which is handy when the numbers change per project.

---

::: tip About this article
Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; tool links now point at this site and the commands are unchanged.
:::

**Related tools**: [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) · [FFmpeg in-browser Runner](https://agicodehub.com/ffmpeg-script-tool)

**Related reading**: [FFmpeg GIF: Ultimate Guide to Creating and Optimizing GIFs with FFmpeg](./ffmpeg-gif-ultimate-guide.md) · [MP4 to GIF FFmpeg: Complete Conversion Guide with Pro Tips](./mp4-to-gif-ffmpeg-complete-conversion-guide.md)

<!-- adapted: agicodehub -->
