<script setup lang="ts">
import QRCode from 'qrcode';
import type { UploadFileInfo } from 'naive-ui';

const message = useMessage();
const { t, locale } = useI18n();

const K = 'tools.wechat-qr-namecard-generator.';

// ===== 默认内容（随语言切换；用户自定义后不再覆盖） =====
// 服务默认值用组件内映射（vue-i18n 会把 | 视为复数分隔符，不能存入翻译文件）
const DEFAULT_SERVICES: Record<string, string[]> = {
  zh: ['逆向接单', '软件远程帮安装服务', 'REA全套安装服务'],
  en: ['Reverse engineering orders', 'Remote software installation service', 'REA full installation service'],
};

const nickname = ref('yangxg');
const regionTouched = ref(false);
const region = ref(t(`${K}defaultRegion`));
const slogan = ref('');
const hintTouched = ref(false);
const serviceTitleTouched = ref(false);
const serviceTitle = ref(t(`${K}serviceTitlePlaceholder`));
const servicesTouched = ref(false);
const services = ref<string[]>(DEFAULT_SERVICES[locale.value] ?? DEFAULT_SERVICES.en);
const hint = ref(t(`${K}hintPlaceholder`));

// 切换语言时，若默认内容未被用户自定义，则跟随新语言更新
watch(locale, () => {
  if (!regionTouched.value) {
    region.value = t(`${K}defaultRegion`);
  }
  if (!servicesTouched.value) {
    services.value = DEFAULT_SERVICES[locale.value] ?? DEFAULT_SERVICES.en;
  }
  if (!hintTouched.value) {
    hint.value = t(`${K}hintPlaceholder`);
  }
  if (!serviceTitleTouched.value) {
    serviceTitle.value = t(`${K}serviceTitlePlaceholder`);
  }
});

// ===== 素材 =====
const avatarDataUrl = ref('');
const qrDataUrl = ref('');
const qrLink = ref('');

// ===== 样式 =====
const themeColor = ref('#07C160');
const bgColor = ref('#FFFFFF');
const cardRadius = ref(24);
const servicePosition = ref<'bottom' | 'top'>('bottom');
const tagStyle = ref<'tag' | 'card' | 'list'>('tag');
const avatarShape = ref<'circle' | 'rounded' | 'square'>('circle');
const qrRounded = ref(true);
const scale = ref(2);

const colorPresets = [
  { nameKey: 'wechatGreen', theme: '#07C160', bg: '#FFFFFF' },
  { nameKey: 'freshBlue', theme: '#2E9BF3', bg: '#FFFFFF' },
  { nameKey: 'vividOrange', theme: '#FF7A00', bg: '#FFFFFF' },
  { nameKey: 'darkGreen', theme: '#0F9D6B', bg: '#F0F7F4' },
];

const positionOptions = [
  { labelKey: 'belowQr', value: 'bottom' },
  { labelKey: 'aboveQr', value: 'top' },
];

const tagStyleOptions = [
  { labelKey: 'tag', value: 'tag' },
  { labelKey: 'card', value: 'card' },
  { labelKey: 'list', value: 'list' },
];

const avatarShapeOptions = [
  { labelKey: 'circle', value: 'circle' },
  { labelKey: 'rounded', value: 'rounded' },
  { labelKey: 'square', value: 'square' },
];

const scaleOptions = [1, 2, 3];

function applyPreset(preset: { theme: string; bg: string }) {
  themeColor.value = preset.theme;
  bgColor.value = preset.bg;
}

// ===== 服务增删 =====
function addService() {
  services.value.push('');
}

function removeService(index: number) {
  services.value.splice(index, 1);
}

// ===== 素材上传 =====
function handleUpload(options: { file: UploadFileInfo }, kind: 'avatar' | 'qr') {
  const file = options.file.file;
  if (!file) {
    return false;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result ?? '');
    if (kind === 'avatar') {
      avatarDataUrl.value = dataUrl;
    }
    else {
      qrDataUrl.value = dataUrl;
    }
  };
  reader.readAsDataURL(file);
  return false;
}

// ===== 生成二维码（离线，内置 qrcode 库） =====
const qrGenerating = ref(false);

async function generateQr() {
  const text = qrLink.value.trim();
  if (!text) {
    message.warning(t(`${K}qrNeedText`));
    return;
  }
  qrGenerating.value = true;
  try {
    qrDataUrl.value = await QRCode.toDataURL(text, {
      width: 520,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
    message.success(t(`${K}qrGenerated`));
  }
  catch {
    message.error(t(`${K}qrFailed`));
  }
  finally {
    qrGenerating.value = false;
  }
}

// ===== 预览 =====
const avatarDisplay = computed(() => avatarDataUrl.value || (nickname.value.trim() || 'W').slice(0, 1));
const hasAvatar = computed(() => !!avatarDataUrl.value);
const hasQr = computed(() => !!qrDataUrl.value);
const visibleServices = computed(() => services.value.map(s => s.trim()).filter(Boolean));

// ===== 导出 PNG =====
const exporting = ref(false);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

const FONT_STACK = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

function measureTagWidth(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = `600 22px ${FONT_STACK}`;
  return ctx.measureText(text).width;
}

async function exportPng() {
  if (!qrDataUrl.value) {
    message.warning(t(`${K}qrNeedFirst`));
    return;
  }
  if (exporting.value) {
    return;
  }
  exporting.value = true;
  try {
    const sc = scale.value;
    const W = 900;
    const H = 1200;
    const cv = document.createElement('canvas');
    cv.width = W * sc;
    cv.height = H * sc;
    const ctx = cv.getContext('2d');
    if (!ctx) {
      message.error(t(`${K}exportUnsupported`));
      return;
    }
    ctx.scale(sc, sc);

    // 名片底色（圆角裁切）
    ctx.save();
    roundRectPath(ctx, 0, 0, W, H, cardRadius.value);
    ctx.clip();
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // 素材
    const qrImg = await loadImage(qrDataUrl.value);
    let avImg: HTMLImageElement | null = null;
    if (avatarDataUrl.value) {
      try {
        avImg = await loadImage(avatarDataUrl.value);
      }
      catch {
        avImg = null;
      }
    }

    const headTop = 56;

    // 头像
    const r = 44;
    const avX = 70 + r;
    const avY = headTop + r;
    ctx.save();
    ctx.beginPath();
    if (avatarShape.value === 'circle') {
      ctx.arc(avX, avY, r, 0, Math.PI * 2);
    }
    else if (avatarShape.value === 'rounded') {
      roundRectPath(ctx, avX - r, avY - r, r * 2, r * 2, 16);
    }
    else {
      ctx.rect(avX - r, avY - r, r * 2, r * 2);
    }
    ctx.clip();
    if (avImg) {
      ctx.drawImage(avImg, avX - r, avY - r, r * 2, r * 2);
    }
    else {
      ctx.fillStyle = themeColor.value;
      ctx.fillRect(avX - r, avY - r, r * 2, r * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold 40px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((nickname.value.trim() || 'W').slice(0, 1), avX, avY + 2);
    }
    ctx.restore();

    // 昵称区
    drawText(ctx, t(`${K}wechatNickLabel`), 134, headTop + 22, `600 16px ${FONT_STACK}`, themeColor.value);
    drawText(ctx, nickname.value.trim() || t(`${K}unnamed`), 134, headTop + 58, `bold 34px ${FONT_STACK}`, '#1F2329');
    drawText(ctx, region.value.trim(), 134, headTop + 88, `20px ${FONT_STACK}`, '#8A8F99');
    let headEnd = headTop + 88;
    if (slogan.value.trim()) {
      headEnd += 36;
      drawText(ctx, slogan.value.trim(), 134, headEnd, `20px ${FONT_STACK}`, '#8A8F99');
    }
    headEnd += 12;

    // 服务区尺寸
    const tags = visibleServices.value;
    const tagsH = 30 + tags.length * 42 + 8;
    const hintY = H - 44;

    // 布局：bottom=服务区在下；top=服务区在上
    let qrTop = 0;
    let tagsTop = 0;
    const availEnd = hintY - 30;
    if (servicePosition.value === 'bottom') {
      tagsTop = availEnd - tagsH;
      qrTop = headEnd + Math.max(0, (availEnd - tagsH - headEnd - 520) / 2);
    }
    else {
      tagsTop = headEnd + 10;
      qrTop = tagsTop + tagsH + Math.max(0, (availEnd - (tagsTop + tagsH) - 520) / 2);
    }

    // 服务区
    if (tags.length > 0) {
      drawText(ctx, serviceTitle.value.trim() || t(`${K}serviceTitlePlaceholder`), 70, tagsTop + 24, `bold 26px ${FONT_STACK}`, themeColor.value);
      let ty = tagsTop + 54;
      for (const tag of tags) {
        const tw = measureTagWidth(ctx, tag);
        if (tagStyle.value === 'tag') {
          ctx.strokeStyle = themeColor.value;
          ctx.lineWidth = 2;
          roundRectPath(ctx, 70, ty - 24, tw + 44, 34, 17);
          ctx.stroke();
          drawText(ctx, tag, 92, ty - 6, `600 22px ${FONT_STACK}`, themeColor.value);
        }
        else if (tagStyle.value === 'card') {
          ctx.fillStyle = themeColor.value;
          roundRectPath(ctx, 70, ty - 24, tw + 44, 34, 8);
          ctx.fill();
          drawText(ctx, tag, 92, ty - 6, `600 22px ${FONT_STACK}`, '#FFFFFF');
        }
        else {
          ctx.fillStyle = themeColor.value;
          ctx.beginPath();
          ctx.arc(78, ty - 3, 4, 0, Math.PI * 2);
          ctx.fill();
          drawText(ctx, tag, 94, ty - 6, `22px ${FONT_STACK}`, '#1F2329');
        }
        ty += 42;
      }
    }

    // 二维码（等比绘制，不拉伸）
    const slot = 520;
    const qrX = (W - slot) / 2;
    ctx.save();
    if (qrRounded.value) {
      roundRectPath(ctx, qrX, qrTop, slot, slot, 20);
    }
    else {
      ctx.rect(qrX, qrTop, slot, slot);
    }
    ctx.clip();
    const ratio = qrImg.width / qrImg.height;
    let qw = slot;
    let qh = slot;
    if (ratio >= 1) {
      qh = slot / ratio;
    }
    else {
      qw = slot * ratio;
    }
    ctx.drawImage(qrImg, qrX + (slot - qw) / 2, qrTop + (slot - qh) / 2, qw, qh);
    ctx.restore();

    // 底部提示语 + 主题色装饰线
    drawText(ctx, hint.value.trim() || t(`${K}hintPlaceholder`), W / 2, hintY, `500 22px ${FONT_STACK}`, themeColor.value, 'center');
    ctx.fillStyle = themeColor.value;
    ctx.fillRect(W / 2 - 22, hintY + 14, 44, 3);

    // 下载
    const a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = `微信名片-${nickname.value.trim() || '未命名'}-${W * sc}x${H * sc}.png`;
    a.click();
    message.success(t(`${K}exported`, { size: `${W * sc}×${H * sc}` }));
  }
  catch {
    message.error(t(`${K}exportFailed`));
  }
  finally {
    exporting.value = false;
  }
}
</script>

<template>
  <div grid grid-cols-1 gap-4 xl:grid-cols-2>
    <!-- 设置面板 -->
    <div flex flex-col gap-4>
      <!-- 文案 -->
      <c-card>
        <div mb-4 text-16px font-600>
          {{ t(`${K}copy`) }}
        </div>
        <n-form label-placement="left" label-width="90px">
          <n-form-item :label="t(`${K}nickname`)">
            <n-input v-model:value="nickname" :placeholder="t(`${K}nicknamePlaceholder`)" />
          </n-form-item>
          <n-form-item :label="t(`${K}region`)">
            <n-input v-model:value="region" :placeholder="t(`${K}regionPlaceholder`)" @update:value="regionTouched = true" />
          </n-form-item>
          <n-form-item :label="t(`${K}topSlogan`)">
            <n-input v-model:value="slogan" :placeholder="t(`${K}sloganPlaceholder`)" />
          </n-form-item>
          <n-form-item :label="t(`${K}bottomHint`)">
            <n-input v-model:value="hint" :placeholder="t(`${K}hintPlaceholder`)" @update:value="hintTouched = true" />
          </n-form-item>
        </n-form>
      </c-card>

      <!-- 服务项目 -->
      <c-card>
        <div mb-4 flex items-center justify-between>
          <div text-16px font-600>
            {{ t(`${K}services`) }}
          </div>
          <n-button size="small" type="primary" ghost @click="addService">
            {{ t(`${K}addService`) }}
          </n-button>
        </div>
        <n-form label-placement="left" label-width="90px">
          <n-form-item :label="t(`${K}serviceTitle`)">
            <n-input v-model:value="serviceTitle" :placeholder="t(`${K}serviceTitlePlaceholder`)" @update:value="serviceTitleTouched = true" />
          </n-form-item>
        </n-form>
        <div flex flex-col gap-2>
          <div v-for="(item, index) in services" :key="index" flex items-center gap-2>
            <n-input v-model:value="services[index]" :placeholder="t(`${K}servicePlaceholder`)" @update:value="servicesTouched = true" />
            <n-button size="small" quaternary type="error" @click="removeService(index)">
              <template #icon>
                <icon-mdi-close />
              </template>
            </n-button>
          </div>
        </div>
      </c-card>

      <!-- 二维码 -->
      <c-card>
        <div mb-4 text-16px font-600>
          {{ t(`${K}qr`) }}
        </div>
        <div mb-3 flex items-center gap-3>
          <n-upload
            accept="image/*"
            :show-file-list="false"
            :max="1"
            @before-upload="options => handleUpload(options, 'qr')"
          >
            <n-button size="small">{{ t(`${K}uploadQr`) }}</n-button>
          </n-upload>
          <span v-if="hasQr" text-12px text-green-600>
            {{ t(`${K}set`) }}
          </span>
          <span v-else text-12px op-50>
            {{ t(`${K}unset`) }}
          </span>
        </div>
        <div flex items-center gap-2>
          <n-input v-model:value="qrLink" :placeholder="t(`${K}qrLinkPlaceholder`)" />
          <n-button size="small" type="primary" :loading="qrGenerating" @click="generateQr">
            {{ t(`${K}generate`) }}
          </n-button>
        </div>
        <div mt-2 text-12px op-50>
          {{ t(`${K}qrTip`) }}
        </div>
      </c-card>

      <!-- 样式 -->
      <c-card>
        <div mb-4 text-16px font-600>
          {{ t(`${K}style`) }}
        </div>
        <n-form label-placement="left" label-width="90px">
          <n-form-item :label="t(`${K}preset`)">
            <div flex flex-wrap gap-2>
              <n-button
                v-for="preset in colorPresets"
                :key="preset.nameKey"
                size="small"
                :style="{ color: preset.theme }"
                @click="applyPreset(preset)"
              >
                {{ t(`${K}${preset.nameKey}`) }}
              </n-button>
            </div>
          </n-form-item>
          <n-form-item :label="t(`${K}themeColor`)">
            <n-color-picker v-model:value="themeColor" :modes="['hex']" />
          </n-form-item>
          <n-form-item :label="t(`${K}bgColor`)">
            <n-color-picker v-model:value="bgColor" :modes="['hex']" />
          </n-form-item>
          <n-form-item :label="t(`${K}cardRadius`)">
            <div flex items-center gap-3 w-full>
              <n-slider v-model:value="cardRadius" :min="0" :max="40" w-full />
              <span w-10 text-right op-70>
                {{ cardRadius }}
              </span>
            </div>
          </n-form-item>
          <n-form-item :label="t(`${K}servicePosition`)">
            <n-radio-group v-model:value="servicePosition">
              <n-radio-button
                v-for="opt in positionOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ t(`${K}${opt.labelKey}`) }}
              </n-radio-button>
            </n-radio-group>
          </n-form-item>
          <n-form-item :label="t(`${K}tagStyle`)">
            <n-radio-group v-model:value="tagStyle">
              <n-radio-button
                v-for="opt in tagStyleOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ t(`${K}${opt.labelKey}`) }}
              </n-radio-button>
            </n-radio-group>
          </n-form-item>
          <n-form-item :label="t(`${K}avatarShape`)">
            <n-radio-group v-model:value="avatarShape">
              <n-radio-button
                v-for="opt in avatarShapeOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ t(`${K}${opt.labelKey}`) }}
              </n-radio-button>
            </n-radio-group>
          </n-form-item>
          <n-form-item :label="t(`${K}qrRounded`)">
            <n-switch v-model:value="qrRounded" />
          </n-form-item>
        </n-form>
      </c-card>
    </div>

    <!-- 预览与导出 -->
    <div flex flex-col items-center gap-4>
      <c-card w-full>
        <div mb-3 flex items-center justify-between>
          <div text-16px font-600>
            {{ t(`${K}preview`) }}
          </div>
          <div flex items-center gap-2>
            <n-radio-group v-model:value="scale" size="small">
              <n-radio-button v-for="s in scaleOptions" :key="s" :value="s">
                {{ s }}x
              </n-radio-button>
            </n-radio-group>
            <n-button type="primary" :loading="exporting" :disabled="!hasQr" @click="exportPng">
              {{ t(`${K}exportPng`) }}
            </n-button>
          </div>
        </div>

        <div class="namecard-stage" flex justify-center py-4>
          <div
            class="namecard"
            :style="{
              '--theme': themeColor,
              '--bg': bgColor,
              '--radius': `${cardRadius}px`,
            }"
          >
            <!-- 头部 -->
            <div class="nc-head">
              <div
                class="nc-avatar"
                :class="{
                  'is-circle': avatarShape === 'circle',
                  'is-rounded': avatarShape === 'rounded',
                  'is-square': avatarShape === 'square',
                }"
              >
                <img v-if="hasAvatar" :src="avatarDataUrl" alt="avatar">
                <span v-else>{{ avatarDisplay }}</span>
              </div>
              <div class="nc-id">
                <div class="nc-nick-label">{{ t(`${K}wechatNickLabel`) }}</div>
                <div class="nc-nick">{{ nickname || t(`${K}unnamed`) }}</div>
                <div class="nc-region">{{ region }}</div>
                <div v-if="slogan" class="nc-slogan">{{ slogan }}</div>
              </div>
            </div>

            <!-- 服务区（上方） -->
            <div v-if="servicePosition === 'top'" class="nc-services">
              <div class="nc-st-title">{{ serviceTitle || t(`${K}serviceTitlePlaceholder`) }}</div>
              <div class="nc-tags">
                <span
                  v-for="(tag, i) in visibleServices"
                  :key="i"
                  class="nc-tag"
                  :class="`is-${tagStyle}`"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- 二维码 -->
            <div class="nc-qr">
              <div v-if="hasQr" class="nc-qr-img" :class="{ 'is-rounded': qrRounded }">
                <img :src="qrDataUrl" alt="QR code">
              </div>
              <div v-else class="nc-qr-empty">
                <icon-mdi-qrcode-scan />
                <span>{{ t(`${K}qrEmpty`) }}</span>
              </div>
            </div>

            <!-- 服务区（下方） -->
            <div v-if="servicePosition === 'bottom'" class="nc-services">
              <div class="nc-st-title">{{ serviceTitle || t(`${K}serviceTitlePlaceholder`) }}</div>
              <div class="nc-tags">
                <span
                  v-for="(tag, i) in visibleServices"
                  :key="i"
                  class="nc-tag"
                  :class="`is-${tagStyle}`"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- 底部提示 -->
            <div class="nc-hint">
              {{ hint }}
              <div class="nc-hint-line" />
            </div>
          </div>
        </div>
      </c-card>
    </div>
  </div>
</template>

<style scoped>
.namecard {
  --theme: #07C160;
  --bg: #FFFFFF;
  --radius: 24px;
  width: min(100%, 420px);
  aspect-ratio: 3 / 4;
  background: var(--bg);
  border-radius: var(--radius);
  border: 2px solid var(--theme);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 26px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
}

.nc-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.nc-avatar {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  background: var(--theme);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  overflow: hidden;
}

.nc-avatar.is-circle {
  border-radius: 50%;
}

.nc-avatar.is-rounded {
  border-radius: 12px;
}

.nc-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nc-id {
  min-width: 0;
}

.nc-nick-label {
  color: var(--theme);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.nc-nick {
  font-size: 22px;
  font-weight: 700;
  color: #1f2329;
  line-height: 1.3;
}

.nc-region {
  font-size: 13px;
  color: #8a8f99;
  margin-top: 2px;
}

.nc-slogan {
  font-size: 13px;
  color: #8a8f99;
  margin-top: 2px;
}

.nc-qr {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nc-qr-img {
  width: 100%;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nc-qr-img.is-rounded {
  border-radius: 14px;
}

.nc-qr-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.nc-qr-empty {
  width: 100%;
  height: 100%;
  border: 2px dashed color-mix(in srgb, var(--theme) 45%, transparent);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: color-mix(in srgb, var(--theme) 70%, #8a8f99);
  font-size: 13px;
  opacity: 0.8;
}

.nc-qr-empty :deep(svg) {
  width: 44px;
  height: 44px;
}

.nc-services {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nc-st-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--theme);
}

.nc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.nc-tag {
  font-size: 13px;
  line-height: 1;
  padding: 6px 12px;
}

.nc-tag.is-tag {
  border: 1.5px solid var(--theme);
  border-radius: 999px;
  color: var(--theme);
  font-weight: 600;
}

.nc-tag.is-card {
  background: var(--theme);
  border-radius: 6px;
  color: #fff;
  font-weight: 600;
}

.nc-tag.is-list {
  position: relative;
  padding-left: 16px;
  color: #1f2329;
}

.nc-tag.is-list::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--theme);
  transform: translateY(-50%);
}

.nc-hint {
  text-align: center;
  color: var(--theme);
  font-size: 14px;
  font-weight: 500;
  padding-top: 6px;
}

.nc-hint-line {
  width: 44px;
  height: 3px;
  border-radius: 2px;
  background: var(--theme);
  margin: 6px auto 0;
}
</style>
