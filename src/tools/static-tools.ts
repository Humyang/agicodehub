import { defineComponent, h, type Component } from 'vue';
import { Movie, Photo, Bolt, GridDots, PlayerPlay, FileCode, DeviceMobile } from '@vicons/tabler';
import { defineTool } from './tool';
import { translate } from '@/plugins/i18n.plugin';
import StaticToolFrame from '../components/StaticToolFrame.vue';

// Creates a tool entry that loads a legacy static HTML tool inside an iframe.
// The static pages are served from the project's public/ folder, preserving
// their original URL structure (/static/..., /dve2/tools/...).
//
// `src` accepts either a single page or a per-language pair. Single-language
// pages are translated at runtime by public/script/legacy-i18n.js, which the
// pages load themselves and which StaticToolFrame drives from the app locale.
type LocaleSrc = string | Partial<Record<'zh' | 'en', string>>;

function staticTool(options: {
  name: string
  path: string
  description: string
  keywords: string[]
  src: LocaleSrc
  icon: Component
  redirectFrom?: string[]
}) {
  const { name, path, description, keywords, src, icon, redirectFrom } = options;
  const component = () =>
    Promise.resolve(
      defineComponent({
        name,
        render: () => h(StaticToolFrame, { src, title: name }),
      }),
    );

  // ⚠️ `bare` keeps the outer header hidden: these embedded apps render their own chrome.
  return defineTool({ name, path, description, keywords, icon, component, wide: true, bare: true, redirectFrom });
}

/* --- FFmpeg tools -------------------------------------------------------
 * All command generators were consolidated into the native "FFmpeg 命令工坊"
 * tool (src/tools/ffmpeg-workbench). The pages below are kept as embedded apps
 * because they cannot be expressed as a command generator:
 *   - grid-image: a template/slot design editor
 *   - script tool: actually runs ffmpeg.wasm inside the browser
 * The superseded generator pages stay on disk under public/static/ffmpeghtml/
 * and their old URLs redirect to the matching workbench tab.
 * ---------------------------------------------------------------------- */

export const ffmpegGridImage = staticTool({
  name: translate('tools.ffmpeg-grid-image.title'),
  path: '/ffmpeg-grid-image',
  description: translate('tools.ffmpeg-grid-image.description'),
  keywords: ['ffmpeg', 'grid', 'image', '拼图', '九宫格', '封面', 'collage'],
  src: '/static/ffmpeghtml/grid-image/index.html',
  icon: GridDots,
});

export const ffmpegScriptTool = staticTool({
  name: translate('tools.ffmpeg-script-tool.title'),
  path: '/ffmpeg-script-tool',
  description: translate('tools.ffmpeg-script-tool.description'),
  keywords: ['ffmpeg', 'script', 'split', 'gif', 'slideshow', 'crop', '幻灯片', 'wasm'],
  src: '/dve2/tools/ffmpeg-script-tool3/index.html',
  icon: Movie,
  // Older builds of the same app that no longer get their own menu entry
  redirectFrom: ['/ffmpeg-tool', '/ffmpeg-script-tool-2', '/ffmpeg-script-tool-3'],
});

export const ffmpegTransparentVideo = staticTool({
  name: translate('tools.ffmpeg-transparent-video.title'),
  path: '/ffmpeg-transparent-video',
  description: translate('tools.ffmpeg-transparent-video.description'),
  keywords: ['ffmpeg', 'transparent', 'alpha', 'video', 'playback', '透明'],
  src: '/static/ffmpeghtml/videoview.html',
  icon: PlayerPlay,
});

/* --- Code tools (from static/codetool) ----------------------------------
 * offline-html-dev and sprite-sheet-merger ship as a Chinese *and* an English
 * page; they are exposed as one entry each that follows the app language.
 * The old "-en" routes redirect to the single entry.
 * ---------------------------------------------------------------------- */
export const offlineHtmlDev = staticTool({
  name: translate('tools.offline-html-dev.title'),
  path: '/offline-html-dev',
  description: translate('tools.offline-html-dev.description'),
  keywords: ['offline', 'html', 'dev', 'environment', '离线'],
  src: {
    zh: '/static/codetool/offlinehtml_cn.html',
    en: '/static/codetool/offlinehtml.html',
  },
  icon: FileCode,
  redirectFrom: ['/offline-html-dev-en'],
});

export const spriteSheetMerger = staticTool({
  name: translate('tools.sprite-sheet-merger.title'),
  path: '/sprite-sheet-merger',
  description: translate('tools.sprite-sheet-merger.description'),
  keywords: ['sprite', 'sheet', 'merge', '雪碧图', 'icon'],
  src: {
    zh: '/static/codetool/spiretool_cn.html',
    en: '/static/codetool/spiretool.html',
  },
  icon: Photo,
  redirectFrom: ['/sprite-sheet-merger-en'],
});

export const glitchGenerator = staticTool({
  name: translate('tools.glitch-generator.title'),
  path: '/glitch-generator',
  description: translate('tools.glitch-generator.description'),
  keywords: ['glitch', 'icon', 'generator', 'dynamic'],
  src: '/static/codetool/DynamicIcon.html',
  icon: Bolt,
});

/* --- Icon sprite paginators (from static/ui/iconstyle) --- */
export const iconSpritePaginatorGlass = staticTool({
  name: translate('tools.icon-sprite-paginator-glass.title'),
  path: '/icon-sprite-paginator-glass',
  description: translate('tools.icon-sprite-paginator-glass.description'),
  keywords: ['icon', 'sprite', 'paginator', 'glass'],
  src: '/static/ui/iconstyle/googleicon/glassstyle/1/index.html',
  icon: GridDots,
});

export const iconSpritePaginatorCyberpunk = staticTool({
  name: translate('tools.icon-sprite-paginator-cyberpunk.title'),
  path: '/icon-sprite-paginator-cyberpunk',
  description: translate('tools.icon-sprite-paginator-cyberpunk.description'),
  keywords: ['icon', 'sprite', 'paginator', 'cyberpunk'],
  src: '/static/ui/iconstyle/googleicon/Cyberpunk/index.html',
  icon: GridDots,
});

export const iconSpritePaginatorElement = staticTool({
  name: translate('tools.icon-sprite-paginator-element.title'),
  path: '/icon-sprite-paginator-element',
  description: translate('tools.icon-sprite-paginator-element.description'),
  keywords: ['icon', 'sprite', 'paginator', 'elementui'],
  src: '/static/ui/iconstyle/elementui/Cyberpunk/index.html',
  icon: GridDots,
});

/* --- 3D demos (migrated from dve2.com) ----------------------------------
 * iPhone Duo fold preview: a self-contained Three.js page (three vendored
 * under the page folder, textures/UI assets local). Migrated from
 * https://www.dve2.com/iphone-duo-gesture/ so the demo lives on agicodehub.
 * ---------------------------------------------------------------------- */
export const iphoneDuoGesture = staticTool({
  name: translate('tools.iphone-duo-gesture.title'),
  path: '/iphone-duo-gesture',
  description: translate('tools.iphone-duo-gesture.description'),
  keywords: ['iphone', 'duo', 'fold', 'foldable', '3d', 'three.js', 'gesture', '折叠屏', '演示'],
  src: '/static/iphone-duo-gesture/index.html',
  icon: DeviceMobile,
  redirectFrom: ['/iphone-duo'],
});

