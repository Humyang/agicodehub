---
title: "FFmpeg Online: Web-Based Tools and Script Generators for Media Processing"
date: 2025-03-17
description: "Where browser FFmpeg hits its ceiling — wasm memory, codec and threading limits — and which commands still need the local binary."
tags: [FFmpeg]
legacy_id: 305
legacy_url: "https://www.dve2.com/archives/305/ffmpeg-online-web-based-tools-and-script-generators-for-media-processing/"
restored_from: wayback
---

# FFmpeg Online: Web-Based Tools and Script Generators for Media Processing
You have a 40-minute screen recording to trim, or a folder of WAVs to normalise, and the only thing open is a browser. Before you reach for a page that claims to run FFmpeg, it helps to know which half of the job it can finish. A browser build and a local binary are the same program compiled for different targets, and that gap decides what runs, what silently produces a broken file, and what fails after ten minutes.

This note maps that boundary: what `ffmpeg.wasm` can do, what a command generator cannot check, and which commands belong on your own machine.

## What a browser build actually is

`ffmpeg.wasm` is FFmpeg compiled to WebAssembly and loaded into a page. Three consequences follow directly from that, and they cover most of the surprises:

- **Memory.** The whole input file has to exist inside the wasm heap, alongside the output being written. The 32-bit address space puts a hard ceiling on the process, and browsers set their own limits below it. A multi-gigabyte source does not "run slowly" — it aborts.
- **Threads.** Encoding is single-threaded unless the page is served with cross-origin isolation headers (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`) so `SharedArrayBuffer` is available. Without them, a job that takes seconds locally can take minutes.
- **Codecs and filters.** You get exactly what the build shipped. Hardware encoders do not exist in wasm — there is no `-hwaccel`, no `videotoolbox`, no `nvenc`. Filters that depend on external libraries, notably the `subtitles` and `ass` filters that need libass plus real fonts, are usually missing, and so is anything expecting a real filesystem or a pipe.

The observable symptom is a clear error if you are lucky, and a truncated or audio-only file if you are not. So check the build before trusting it:

```bash
ffmpeg -hide_banner -encoders | grep -E 'libx264|libvpx-vp9|libsvtav1'
```

`-hide_banner` suppresses the build banner and configuration dump; `-encoders` lists what this specific build can write. If `libx264` is absent, anything asking for H.264 output falls back to whatever else matched or fails outright. Run the same line inside the browser tool's console if it exposes one — that is the honest inventory of its capabilities.

## Where a script generator stops

A command generator maps form fields to flags. That is genuinely useful: `-movflags +faststart` in the wrong position, a missing `-map`, a filter that needs `-filter_complex` instead of `-vf`, quoting that breaks in PowerShell — those are the mistakes people make. A generator removes them.

What it cannot do is look at your file. It does not know the input is variable frame rate, that audio track 2 is 5.1 while track 1 is stereo, that the file has no `moov` atom at the front, or that the recording is 10-bit. It also only knows the flags someone templated: ask for a second audio track with `-map 0:a:1` and a disposition override, and the form has nowhere to put it, so the flag simply vanishes from the generated command.

Treat the output as a draft, then verify it against the actual file before spending an hour on it. [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) is one place to assemble such a draft; the part that matters is what you do with it next.

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,width,height,pix_fmt,r_frame_rate \
  -of default=noprint_wrappers=1 input.mp4
```

`-select_streams v:0` limits output to the first video stream, `-show_entries` names the fields, and `-of default=noprint_wrappers=1` drops the section headers so the result greps cleanly. `pix_fmt` matters because `yuv420p10le` means the browser path will either fail or downconvert without telling you.

## Commands that belong on the local binary

**Two-pass bitrate targeting.** Pass 1 writes statistics; pass 2 encodes with them. The `-passlogfile` must match, or pass 2 reads nothing.

```bash
ffmpeg -y -i input.mp4 -c:v libx264 -preset slow -b:v 3M -pass 1 -passlogfile x264pass -an -f null /dev/null
ffmpeg -y -i input.mp4 -c:v libx264 -preset slow -b:v 3M -pass 2 -passlogfile x264pass -c:a aac -b:a 160k -movflags +faststart output.mp4
```

`-an` in pass 1 skips audio; `-f null /dev/null` discards the output (Windows: `NUL`). This needs a real filesystem for the log, so it is a non-starter in a tab.

**Loudness normalisation.** `loudnorm` measures the whole programme, so it cannot stream.

```bash
ffmpeg -i input.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k output.m4a
```

`I=-16` is the integrated target in LUFS, `TP=-1.5` the true-peak ceiling in dBTP, `LRA=11` the loudness range. The filter resamples internally for measurement, so pin `-ar 48000` when downstream expects 48 kHz instead of trusting the source rate.

**Burned-in subtitles.** Needs libass and the named font present on the system.

```bash
ffmpeg -i input.mp4 -vf "subtitles=captions.srt:force_style='FontName=DejaVu Sans,FontSize=22'" \
  -c:v libx264 -crf 20 -c:a copy output.mp4
```

Inside a filtergraph, `:` and `,` are separators, so paths containing them need escaping. Video is re-encoded; `-c:a copy` keeps the audio bit-exact.

**Faststart remux and keyframe-snapped cuts.** Cheap, but they need output they can seek backward to.

```bash
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4
ffmpeg -ss 00:00:12.500 -to 00:00:30 -i input.mp4 -c copy clip.mp4
```

`-ss` before `-i` seeks by index and is fast; with `-c copy` the cut snaps back to the nearest keyframe, so clip length drifts. Re-encode if you need frame accuracy.

**Measured expectations instead of guesses.** Before committing to a long encode, decode once to a null sink and read the reported `speed`:

```bash
ffmpeg -hide_banner -i input.mp4 -map 0:v:0 -f null -
```

`-f null -` discards output while running the full decode. Anything at or below real time locally is going to be untenable in a single-threaded wasm build.

## The working rule

Browser-side: probing, assembling a command, remuxing small files with `-c copy`, extracting a handful of frames, short clips in widely supported codecs. Local binary: two-pass encodes, `loudnorm`, subtitle burn-in, hardware acceleration, HLS packaging with `-f hls`, pipes, damaged files needing `-fflags +genpts`, and anything whose source will not fit comfortably in memory. Long jobs also fight background-tab throttling — a suspended tab is not an encoding server.

---

::: tip About this article
Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; tool links now point at this site and the commands are unchanged.
:::

**Related tools**: [FFmpeg Command Workbench](https://agicodehub.com/ffmpeg-workbench) · [FFmpeg in-browser Runner](https://agicodehub.com/ffmpeg-script-tool)

**Related reading**: [FFmpeg Online Service: Best Tools for Video & Audio Processing in 2024](./ffmpeg-online-service-best-tools-for-video-audio-processing.md) · [Online FFmpeg: Transform Your Media Processing Workflow in 2024](./online-ffmpeg-transform-your-media-processing-workflow-in-2024.md)

<!-- adapted: agicodehub -->
