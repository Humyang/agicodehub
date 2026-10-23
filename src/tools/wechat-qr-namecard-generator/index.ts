import { DeviceMobileMessage } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.wechat-qr-namecard-generator.title'),
  path: '/wechat-qr-namecard-generator',
  description: translate('tools.wechat-qr-namecard-generator.description'),
  keywords: ['wechat', 'weixin', 'qr', 'code', 'namecard', 'business card', 'generator', '微信', '名片', '二维码', 'social media'],
  component: () => import('./wechat-qr-namecard-generator.vue'),
  icon: DeviceMobileMessage,
  wide: true,
});
