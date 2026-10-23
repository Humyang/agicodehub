import { Tools } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.ffmpeg-workbench.title'),
  path: '/ffmpeg-workbench',
  description: translate('tools.ffmpeg-workbench.description'),
  keywords: [
    'ffmpeg', 'slice', 'crop', 'extract', 'frame', 'speed', 'reverse', 'tile',
    'watermark', 'delogo', 'mask', 'chromakey', 'transcode', '切片', '裁剪', '抽帧', '变速', '倒放', '拼图', '去水印', '抠像',
  ],
  component: () => import('./ffmpeg-workbench.vue'),
  icon: Tools,
  // Tabs bring their own context; an extra title/description block is redundant chrome.
  wide: true,
  bare: true,
  // These stand-alone pages were folded into the matching tab of the workbench.
  redirectFrom: [
    '/ffmpeg-slicing-workshop',
    '/ffmpeg-slicing-workshop-en',
    '/ffmpeg-align-media',
    '/ffmpeg-speed-frame',
    '/ffmpeg-combo',
    '/ffmpeg-overlay-generator',
    '/ffmpeg-video-mask',
  ],
  createdAt: new Date(),
});
