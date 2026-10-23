<script setup lang="ts">
import { Plus, Trash } from '@vicons/tabler';
import { useThemeVars } from 'naive-ui';
import type { Box } from '../ffmpeg-commands';

const props = withDefaults(defineProps<{ modelValue: Box[]; src?: string; isVideo?: boolean }>(), {
  src: '',
  isVideo: false,
});

const emit = defineEmits<{
  'update:modelValue': [Box[]]
  'update:naturalSize': [{ w: number, h: number }]
}>();

const themeVars = useThemeVars();
const { t } = useI18n();
const container = ref<HTMLElement | null>(null);
const mediaEl = ref<HTMLMediaElement | null>(null);
const displayW = ref(0);
const natural = ref({ w: 0, h: 0 });
const selected = ref(-1);

const boxes = computed(() => props.modelValue);
/** natural px -> on-screen px */
const ratio = computed(() => (natural.value.w > 0 ? displayW.value / natural.value.w : 1));

const displayBox = (b: Box) => ({
  left: `${b.x * ratio.value}px`,
  top: `${b.y * ratio.value}px`,
  width: `${Math.max(2, b.w * ratio.value)}px`,
  height: `${Math.max(2, b.h * ratio.value)}px`,
});

function syncNatural() {
  const el = mediaEl.value;
  if (!el) {
    return;
  }
  const w = props.isVideo ? (el as HTMLVideoElement).videoWidth : (el as unknown as HTMLImageElement).naturalWidth;
  const h = props.isVideo ? (el as HTMLVideoElement).videoHeight : (el as unknown as HTMLImageElement).naturalHeight;
  if (w && h) {
    natural.value = { w, h };
    emit('update:naturalSize', { w, h });
  }
  displayW.value = container.value?.clientWidth ?? 0;
}

onMounted(() => {
  window.addEventListener('resize', syncNatural);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', syncNatural);
});
watch(() => props.src, () => {
  selected.value = -1;
  nextTick(syncNatural);
});

function update(index: number, patch: Partial<Box>) {
  const next = boxes.value.map((b, i) => (i === index ? { ...b, ...patch } : b));
  emit('update:modelValue', next);
}

export interface DragState {
  mode: 'move' | 'resize'
  handle: 'nw' | 'ne' | 'sw' | 'se'
  index: number
  startX: number
  startY: number
  origin: Box
}

const drag = ref<DragState | null>(null);

function startDrag(e: PointerEvent, index: number, mode: 'move' | 'resize', handle: 'nw' | 'ne' | 'sw' | 'se' = 'se') {
  e.preventDefault();
  e.stopPropagation();
  selected.value = index;
  drag.value = {
    mode,
    handle,
    index,
    startX: e.clientX,
    startY: e.clientY,
    origin: { ...boxes.value[index] },
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', stopDrag, { once: true });
}

function onMove(e: PointerEvent) {
  const d = drag.value;
  if (!d) {
    return;
  }
  const dx = (e.clientX - d.startX) / ratio.value;
  const dy = (e.clientY - d.startY) / ratio.value;
  const o = d.origin;
  const { w: nw, h: nh } = natural.value || { w: 0, h: 0 };

  if (d.mode === 'move') {
    update(d.index, {
      x: clamp(Math.round(o.x + dx), 0, Math.max(0, nw - o.w)),
      y: clamp(Math.round(o.y + dy), 0, Math.max(0, nh - o.h)),
    });
    return;
  }

  let x = o.x;
  let y = o.y;
  let w = o.w;
  let h = o.h;
  if (d.handle === 'se') {
    w = Math.max(2, o.w + dx);
    h = Math.max(2, o.h + dy);
  }
  else if (d.handle === 'nw') {
    x = o.x + dx;
    y = o.y + dy;
    w = o.w - dx;
    h = o.h - dy;
  }
  else if (d.handle === 'ne') {
    y = o.y + dy;
    w = o.w + dx;
    h = o.h - dy;
  }
  else {
    x = o.x + dx;
    w = o.w - dx;
    h = o.h + dy;
  }

  update(d.index, {
    x: Math.round(Math.max(0, x)),
    y: Math.round(Math.max(0, y)),
    w: Math.round(Math.max(2, w)),
    h: Math.round(Math.max(2, h)),
  });
}

function stopDrag() {
  drag.value = null;
  window.removeEventListener('pointermove', onMove);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function addBox() {
  const nw = natural.value.w || 1920;
  const nh = natural.value.h || 1080;
  const w = Math.round(nw * 0.25);
  const h = Math.round(nh * 0.15);
  const next = [...boxes.value, { x: Math.round((nw - w) / 2), y: Math.round((nh - h) / 2), w, h }];
  emit('update:modelValue', next);
  selected.value = next.length - 1;
}

function removeBox(index: number) {
  selected.value = -1;
  emit('update:modelValue', boxes.value.filter((_, i) => i !== index));
}
</script>

<template>
  <div class="box-canvas">
    <div ref="container" class="box-canvas__stage">
      <video
        v-if="src && isVideo"
        ref="mediaEl"
        :src="src"
        controls
        class="box-canvas__media"
        @loadedmetadata="syncNatural"
      />
      <img
        v-else-if="src"
        ref="mediaEl"
        :src="src"
        class="box-canvas__media"
        @load="syncNatural"
      >
      <div v-else class="box-canvas__placeholder" :style="{ background: themeVars.codeColor }">
        {{ t('tools.ffmpeg-workbench.common.canvasHint') }}
      </div>

      <div v-if="src" class="box-canvas__overlay">
        <div
          v-for="(b, i) in boxes"
          :key="i"
          class="box"
          :class="{ 'box--active': selected === i }"
          :style="displayBox(b)"
          @pointerdown="startDrag($event, i, 'move')"
        >
          <span class="box__label">{{ i + 1 }}</span>
          <span
            v-for="h in (['nw', 'ne', 'sw', 'se'] as const)"
            :key="h"
            class="box__handle"
            :class="`box__handle--${h}`"
            @pointerdown="startDrag($event, i, 'resize', h)"
          />
        </div>
      </div>
    </div>

    <div class="box-canvas__actions">
      <n-button size="tiny" secondary @click="addBox">
        <template #icon>
          <n-icon :component="Plus" />
        </template>
        {{ t('tools.ffmpeg-workbench.common.addRegion') }}
      </n-button>
      <n-button v-if="selected >= 0" size="tiny" secondary type="error" @click="removeBox(selected)">
        <template #icon>
          <n-icon :component="Trash" />
        </template>
        {{ t('tools.ffmpeg-workbench.common.deleteSelected') }}
      </n-button>
      <span class="box-canvas__size">
        {{ natural.w ? t('tools.ffmpeg-workbench.common.sourceSize', { w: natural.w, h: natural.h }) : t('tools.ffmpeg-workbench.common.noMedia') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.box-canvas__stage {
  position: relative;
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(128, 128, 128, 0.08);
}

.box-canvas__media {
  display: block;
  width: 100%;
}

.box-canvas__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  font-size: 13px;
  opacity: 0.6;
  padding: 0 12px;
  text-align: center;
}

.box-canvas__overlay {
  position: absolute;
  inset: 0;
}

.box {
  position: absolute;
  box-sizing: border-box;
  border: 1.5px solid #18a058;
  background: rgba(24, 160, 88, 0.18);
  cursor: move;
  touch-action: none;

  &--active {
    border-color: #f0a020;
    background: rgba(240, 160, 32, 0.22);
  }
}

.box__label {
  position: absolute;
  top: -1px;
  left: -1px;
  padding: 0 4px;
  font-size: 10px;
  color: #fff;
  background: #18a058;
}

.box__handle {
  position: absolute;
  width: 9px;
  height: 9px;
  background: #fff;
  border: 1.5px solid #18a058;
  border-radius: 2px;

  &--nw { top: -5px; left: -5px; cursor: nwse-resize; }
  &--ne { top: -5px; right: -5px; cursor: nesw-resize; }
  &--sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
  &--se { bottom: -5px; right: -5px; cursor: nwse-resize; }
}

.box-canvas__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.box-canvas__size {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.6;
}
</style>
