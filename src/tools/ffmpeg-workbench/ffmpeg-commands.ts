/**
 * Pure FFmpeg command builders.
 *
 * This module is the single source of truth for every command the workbench can
 * produce. The logic was consolidated from the legacy one-page-per-capability
 * generators (ffmpeghtml/config_zh.html, crop7.html, video_speed_frame.html,
 * delogo_overlay.html, mask.html, combo/*) so that overlapping capabilities
 * (crop, frame extraction, tile, reverse, ...) exist exactly once.
 */

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface CropRect {
  w: number
  h: number
  x: number
  y: number
}

export interface SliceSegment {
  start: number
  end: number
  crop: CropRect | null
  scale: string
}

export interface BatchScript {
  label: string
  code: string
}

export interface CommandBundle {
  /** The primary command(s), shown as a code block */
  commands: string[]
  /** Optional ready-to-run batch/shell scripts derived from the commands */
  scripts: BatchScript[]
}

const DEFAULT_INPUT = 'input.mp4'

function q(path: string): string {
  const trimmed = path.trim();
  return `"${trimmed || DEFAULT_INPUT}"`;
}

function num(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

/** `mm:ss.mmm`-friendly seconds formatter used inside generated commands. */
export function formatSeconds(seconds: number): string {
  return num(seconds, 0).toFixed(3);
}

export function toTimecode(seconds: number): string {
  const s = Math.max(0, num(seconds, 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':') + `.${String(ms).padStart(3, '0')}`;
}

export interface BatchLoopOptions {
  extension: string
  outputPattern: string
  coreParams: string
}

/**
 * Wraps a per-file ffmpeg invocation into Windows batch + POSIX shell loops,
 * mirroring the "process the whole folder" scripts from the legacy pages.
 */
export function buildBatchScripts({ extension, outputPattern, coreParams }: BatchLoopOptions): BatchScript[] {
  const ext = extension.replace(/^\./, '') || 'mp4';
  const win = `:: [Windows Batch Script] 保存为 process.bat 放到素材目录
@echo off
for %%f in (*.${ext}) do (
    ffmpeg -i "%%f" ${coreParams} "${outputPattern}"
)
pause`;

  const unix = `# [Mac/Linux Shell Script] 保存为 process.sh，先执行 chmod +x process.sh
#!/bin/bash
for f in *.${ext}; do
    ffmpeg -i "$f" ${coreParams} "${outputPattern}"
done
echo "Done!"`;

  return [
    { label: 'Windows (.bat)', code: win },
    { label: 'Mac / Linux (.sh)', code: unix },
  ];
}

/* ------------------------------------------------------------------ *
 * 1. Slice & crop
 * ------------------------------------------------------------------ */

export interface SliceOptions {
  input: string
  prefix: string
  codec: string
  crf: number
  preset: string
  segments: SliceSegment[]
}

export function buildVideoFilters(segment: Pick<SliceSegment, 'crop' | 'scale'>): string[] {
  const filters: string[] = [];
  if (segment.crop && segment.crop.w > 0 && segment.crop.h > 0) {
    filters.push(`crop=${segment.crop.w}:${segment.crop.h}:${segment.crop.x}:${segment.crop.y}`);
  }
  if (segment.scale && segment.scale !== 'original') {
    filters.push(`scale=${segment.scale}`);
  }
  return filters;
}

export function buildSliceCommands({ input, prefix, codec, crf, preset, segments }: SliceOptions): CommandBundle {
  const inputPath = input.trim() || DEFAULT_INPUT;
  const outPrefix = prefix.trim() || 'output';
  const streamCopy = codec === 'copy';
  const encode = streamCopy
    ? '-c copy'
    : `-c:v ${codec} -c:a aac -preset ${preset} -crf ${num(crf, 23)}`;

  const commands = segments
    .filter(seg => num(seg.end) > num(seg.start))
    .map((seg, idx) => {
      const vf = buildVideoFilters(seg);
      // Stream copy cannot be combined with filters.
      const filterStr = !streamCopy && vf.length > 0 ? ` -vf "${vf.join(',')}"` : '';
      return `ffmpeg -y -ss ${formatSeconds(seg.start)} -to ${formatSeconds(seg.end)} -i "${inputPath}" ${encode}${filterStr} "${outPrefix}_part${idx + 1}.mp4"`;
    });

  const scripts = commands.length === 0
    ? []
    : [
        {
          label: 'Windows (.bat)',
          code: `:: [Windows Batch Script] 保存为 slice.bat，与源视频放在同一目录
@echo off
${commands.map(c => c.replace(`"${inputPath}"`, '"%%f"').replace(`"${outPrefix}_part`, '"output\\%%~nf_part')).join('\r\n')}
pause`,
        },
        {
          label: 'Mac / Linux (.sh)',
          code: `# [Mac/Linux Shell Script] 保存为 slice.sh，先执行 chmod +x slice.sh
#!/bin/bash
${commands.map(c => c.replace(`"${inputPath}"`, '"$f"').replace(`"${outPrefix}_part`, '"output/${f%.*}_part')).join('\n')}
echo "Done!"`,
        },
      ];

  return { commands, scripts };
}

/* ------------------------------------------------------------------ *
 * 2. Frame extraction
 * ------------------------------------------------------------------ */

export type ExtractMethod = 'single' | 'fps' | 'all';

export interface ExtractOptions {
  input: string
  method: ExtractMethod
  timestamp: string
  fps: number
  outDir: string
  pattern: string
  format: string
}

export function buildExtractCommands({ input, method, timestamp, fps, outDir, pattern, format }: ExtractOptions): CommandBundle {
  const inputPath = q(input);
  const dir = outDir.trim().replace(/\/+$/, '');
  const prefix = dir ? `${dir}/` : '';
  const filePattern = pattern.trim() || 'frame';
  const ext = format.replace(/^\./, '') || 'png';
  const scripts: BatchScript[] = [];

  if (method === 'single') {
    const time = timestamp.trim() || '00:00:00';
    return {
      commands: [`ffmpeg -ss ${time} -i ${inputPath} -frames:v 1 "${prefix}${filePattern}.${ext}"`],
      scripts: [{
        label: 'Mac / Linux (.sh)',
        code: `# 批量：抽取每段视频同一时间点的单帧\nfor f in *.mp4; do\n    ffmpeg -ss ${time} -i "$f" -frames:v 1 "${prefix}\${f%.*}_${filePattern}.${ext}"\ndone`,
      }],
    };
  }

  const filter = method === 'fps' ? `-vf "fps=${num(fps, 1)}" ` : '';
  const command = `ffmpeg -i ${inputPath} ${filter}"${prefix}${filePattern}_%04d.${ext}"`;

  scripts.push({
    label: 'Windows (.bat)',
    code: `:: [Windows Batch Script]\n@echo off\nfor %%f in (*.mp4) do (\n    if not exist "frames_%%~nf" mkdir "frames_%%~nf"\n    ffmpeg -i "%%f" ${filter}"frames_%%~nf/${filePattern}_%%04d.${ext}"\n)\npause`,
  });
  scripts.push({
    label: 'Mac / Linux (.sh)',
    code: `# [Mac/Linux Shell Script]\n#!/bin/bash\nfor f in *.mp4; do\n    mkdir -p "frames_\${f%.*}"\n    ffmpeg -i "$f" ${filter}"frames_\${f%.*}/${filePattern}_%04d.${ext}"\ndone\necho "Done!"`,
  });

  return { commands: [command], scripts };
}

/* ------------------------------------------------------------------ *
 * 3. Speed & reverse
 * ------------------------------------------------------------------ */

const TEMPO_MIN = 0.5;
const TEMPO_MAX = 2;

/** atempo only accepts 0.5–2.0, so larger ratios are chained. */
export function buildAudioTempoChain(speed: number): string {
  const safe = speed <= 0 ? 0.1 : speed;
  if (safe >= TEMPO_MIN && safe <= TEMPO_MAX) {
    return `atempo=${safe}`;
  }

  const step = safe > TEMPO_MAX ? TEMPO_MAX : TEMPO_MIN;
  const filters: string[] = [];
  let current = 1;
  while ((safe > TEMPO_MAX && current * TEMPO_MAX < safe) || (safe < TEMPO_MIN && current * TEMPO_MIN > safe)) {
    filters.push(`atempo=${step}`);
    current *= step;
  }
  filters.push(`atempo=${Number((safe / current).toFixed(6))}`);
  return filters.join(',');
}

export interface SpeedOptions {
  input: string
  speed: number
  muteAudio: boolean
  output: string
}

export function buildSpeedCommand({ input, speed, muteAudio, output }: SpeedOptions): CommandBundle {
  const safe = speed <= 0 ? 0.1 : speed;
  const videoFilter = `setpts=${(1 / safe).toFixed(4)}*PTS`;
  const audioOpts = muteAudio ? '-an' : `-filter:a "${buildAudioTempoChain(safe)}"`;
  const out = output.trim() || 'output_speed.mp4';
  const command = `ffmpeg -i ${q(input)} -filter:v "${videoFilter}" ${audioOpts} "${out}"`;
  const core = `-filter:v "${videoFilter}" ${audioOpts}`;

  return {
    commands: [command],
    scripts: [
      {
        label: 'Windows (.bat)',
        code: `:: [Windows Batch Script] 批量变速整个目录\n@echo off\nfor %%f in (*.mp4) do (\n    ffmpeg -i "%%f" ${core} "output\\%%~nf_speed.mp4"\n)\npause`,
      },
      {
        label: 'Mac / Linux (.sh)',
        code: `# [Mac/Linux Shell Script] 批量变速整个目录\n#!/bin/bash\nmkdir -p output\nfor f in *.mp4; do\n    ffmpeg -i "$f" ${core} "output/\${f%.*}_speed.mp4"\ndone\necho "Done!"`,
      },
    ],
  };
}

export interface ReverseOptions {
  input: string
  output: string
  withAudio: boolean
}

export function buildReverseCommand({ input, output, withAudio }: ReverseOptions): CommandBundle {
  const out = output.trim() || 'output_reverse.mp4';
  const audio = withAudio ? ' -af areverse' : '';
  return {
    commands: [`ffmpeg -i ${q(input)} -vf reverse${audio} "${out}"`],
    scripts: [],
  };
}

/* ------------------------------------------------------------------ *
 * 4. Images <-> video, tile, batch crop
 * ------------------------------------------------------------------ */

export interface ImagesToVideoOptions {
  inputPattern: string
  fps: number
  codec: string
  output: string
}

export function buildImagesToVideoCommand({ inputPattern, fps, codec, output }: ImagesToVideoOptions): CommandBundle {
  const pattern = inputPattern.trim() || 'frame_%04d.png';
  const out = output.trim() || 'output.mp4';
  return {
    commands: [`ffmpeg -r ${num(fps, 25)} -i "${pattern}" -c:v ${codec} -pix_fmt yuv420p "${out}"`],
    scripts: [],
  };
}

export interface TileOptions {
  inputPattern: string
  columns: number
  rows: number
  output: string
}

export function buildTileCommand({ inputPattern, columns, rows, output }: TileOptions): CommandBundle {
  const pattern = inputPattern.trim() || 'frame_%04d.png';
  const cols = Math.max(1, Math.round(num(columns, 3)));
  const rowCount = Math.max(1, Math.round(num(rows, 3)));
  const out = output.trim() || 'grid.png';
  return {
    commands: [`ffmpeg -i "${pattern}" -filter_complex "tile=${cols}x${rowCount}" "${out}"`],
    scripts: [],
  };
}

export interface BatchCropOptions {
  inputDir: string
  outputDir: string
  extension: string
  rect: CropRect
}

export function buildBatchCropCommand({ inputDir, outputDir, extension, rect }: BatchCropOptions): CommandBundle {
  const ext = (extension.replace(/^\./, '') || 'png');
  const inDir = inputDir.trim() || `./*.${ext}`;
  const outDir = outputDir.trim().replace(/\/+$/, '') || 'output';
  const filter = `crop=${num(rect.w, 100)}:${num(rect.h, 100)}:${num(rect.x, 0)}:${num(rect.y, 0)}`;
  return {
    commands: [`ffmpeg -i "${inDir}" -filter:v "${filter}" "${outDir}/%04d.${ext}"`],
    scripts: [{
      label: 'Mac / Linux (.sh)',
      code: `# 批量裁剪目录下所有图片\n#!/bin/bash\nmkdir -p "${outDir}"\nfor img in *.${ext}; do\n    ffmpeg -i "$img" -filter:v "${filter}" "${outDir}/$img"\ndone\necho "Done!"`,
    }],
  };
}

/* ------------------------------------------------------------------ *
 * 5. Overlay / delogo / eraser
 * ------------------------------------------------------------------ */

export type OverlayMode = 'overlay' | 'border' | 'delogo' | 'eraser';

export interface OverlayOptions {
  input: string
  mode: OverlayMode
  boxes: Box[]
  /** `#rrggbb` fill colour */
  color: string
  /** 0–1 */
  opacity: number
  /** border thickness in px */
  thickness: number
  /** keep audio track */
  keepAudio: boolean
  /** limit to a single frame */
  singleFrame: boolean
  outputName: string
  outputExt: string
}

function overlayFlags({ keepAudio, singleFrame }: Pick<OverlayOptions, 'keepAudio' | 'singleFrame'>): string {
  const audioFlag = keepAudio ? '' : '-an';
  const framesFlag = singleFrame ? '-frames:v 1' : '';
  return [audioFlag, framesFlag].filter(Boolean).join(' ');
}

export function buildOverlayCommands(options: OverlayOptions): CommandBundle {
  const { input, mode, boxes, color, opacity, thickness, outputName, outputExt } = options;
  const inputPath = q(input);
  const flags = overlayFlags(options);
  const name = outputName.trim() || `output_${mode}`;
  const out = `${name}.${outputExt.replace(/^\./, '') || 'mp4'}`;
  const hex = color.replace(/^#/, '');
  const boxes_ = boxes.filter(b => b.w > 0 && b.h > 0);

  if (boxes_.length === 0) {
    return { commands: [], scripts: [] };
  }

  let command = '';

  if (mode === 'overlay') {
    // Colour patches stacked through a filter_complex chain.
    const parts: string[] = [];
    boxes_.forEach((box, i) => {
      const label = `color${i}`;
      parts.push(`color=c=${hex}@${Number(opacity.toFixed(2))}:s=${Math.round(box.w)}x${Math.round(box.h)}[${label}]`);
    });
    let previous = '0:v';
    boxes_.forEach((box, i) => {
      const next = i === boxes_.length - 1 ? 'out' : `ov${i}`;
      parts.push(`[${previous}][color${i}]overlay=${Math.round(box.x)}:${Math.round(box.y)}${options.singleFrame ? ':shortest=1' : ''}[${next}]`);
      previous = next;
    });
    command = `ffmpeg -i ${inputPath} -filter_complex "${parts.join(';')}" -map "[out]" ${flags} "${out}"`.replace('  ', ' ');
  }
  else if (mode === 'border') {
    const filters = boxes_.map(b => `drawbox=x=${Math.round(b.x)}:y=${Math.round(b.y)}:w=${Math.round(b.w)}:h=${Math.round(b.h)}:color=${hex}@1:t=${Math.round(thickness)}`);
    command = `ffmpeg -i ${inputPath} -vf "${filters.join(',')}" ${flags} "${out}"`.replace('  ', ' ');
  }
  else if (mode === 'delogo') {
    const filters = boxes_.map(b => `delogo=x=${Math.round(b.x)}:y=${Math.round(b.y)}:w=${Math.round(b.w)}:h=${Math.round(b.h)}`);
    command = `ffmpeg -i ${inputPath} -vf "${filters.join(',')}" ${flags} "${out}"`.replace('  ', ' ');
  }
  else {
    const filters = boxes_.map(b => `drawbox=x=${Math.round(b.x)}:y=${Math.round(b.y)}:w=${Math.round(b.w)}:h=${Math.round(b.h)}:color=black@0:t=fill:replace=1`);
    command = `ffmpeg -i ${inputPath} -vf "format=rgba,${filters.join(',')}" ${flags} "${out}"`.replace('  ', ' ');
  }

  // Derive a folder-wide batch script by swapping the input/output tokens out.
  const core = command
    .replace(`-i ${inputPath} `, '')
    .replace(new RegExp(`\\s*"?${out.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"?$`), '')
    .trim();

  return {
    commands: [command],
    scripts: [
      {
        label: 'Windows (.bat)',
        code: `:: [Windows Batch Script] 保存为 process.bat 放到素材目录\n@echo off\nmkdir output 2>nul\nfor %%f in (*.${options.outputExt.replace(/^\./, '') || 'mp4'}) do (\n    ffmpeg -i "%%f" ${core} "output\\%%~nf_${name}.${options.outputExt.replace(/^\./, '')}"\n)\npause`,
      },
      {
        label: 'Mac / Linux (.sh)',
        code: `# [Mac/Linux Shell Script]\n#!/bin/bash\nmkdir -p output\nfor f in *.${options.outputExt.replace(/^\./, '') || 'mp4'}; do\n    ffmpeg -i "$f" ${core} "output/\${f%.*}_${name}.${options.outputExt.replace(/^\./, '')}"\ndone\necho "Done!"`,
      },
    ],
  };
}

/* ------------------------------------------------------------------ *
 * 6. Masking (chromakey / colorkey / alphamask), multi-step
 * ------------------------------------------------------------------ */

export type MaskStepType = 'chromakey' | 'colorkey' | 'alphamask';

export interface MaskStep {
  type: MaskStepType
  color: string
  similarity: number
  blend: number
  /** file name of the transparent-background image (alphamask only) */
  maskFile: string
  output: string
}

export interface MaskOptions {
  input: string
  output: string
  maskExt: string
  steps: MaskStep[]
}

export function buildMaskCommands({ input, output, maskExt, steps }: MaskOptions): CommandBundle {
  const inputPath = input.trim() || DEFAULT_INPUT;
  const out = output.trim() || `output_masked.${maskExt}`;
  const lines: string[] = [];
  let previous = inputPath;

  steps.forEach((step, idx) => {
    const color = step.color.replace(/^#/, '');
    const stepOut = step.output.trim() || `step${idx + 1}.${maskExt}`;
    const kw = `color=0x${color}:similarity=${Number(step.similarity.toFixed(3))}:blend=${Number(step.blend.toFixed(3))}`;

    if (step.type === 'chromakey') {
      lines.push(`# Step ${idx + 1}: 绿幕抠像 (chromakey)`);
      lines.push(`ffmpeg -i "${previous}" -filter_complex "[0]chromakey=${kw}" "${stepOut}"`);
    }
    else if (step.type === 'colorkey') {
      lines.push(`# Step ${idx + 1}: 颜色键控 (colorkey)`);
      lines.push(`ffmpeg -i "${previous}" -filter_complex "[0]colorkey=${kw}" "${stepOut}"`);
    }
    else {
      const maskFile = step.maskFile.trim() || 'mask.png';
      lines.push(`# Step ${idx + 1}: 透明背景图合成 (alphamask)`);
      lines.push(`ffmpeg -i "${previous}" -i "${maskFile}" -filter_complex "[1]scale=rw:rh,format=rgba,alphaextract[alpha];[0]chromakey=${kw}[chroma];[chroma][alpha]alphamerge" "${stepOut}"`);
    }
    lines.push('');
    previous = stepOut;
  });

  if (previous !== out) {
    lines.push('# 重命名为最终输出');
    lines.push(`mv "${previous}" "${out}"`);
  }

  return { commands: lines, scripts: [] };
}

/* ------------------------------------------------------------------ *
 * Misc helpers used by the UI
 * ------------------------------------------------------------------ */

/** x264/x265 speed-quality presets (values, labels are locale-specific in the UI) */
export const PRESETS = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'];

export const IMAGE_FORMATS = [
  { label: 'PNG', value: 'png' },
  { label: 'JPG', value: 'jpg' },
  { label: 'WebP', value: 'webp' },
  { label: 'BMP', value: 'bmp' },
];
