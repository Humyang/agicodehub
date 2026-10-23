<script setup lang="ts">
import { Plus, Trash, Clock } from '@vicons/tabler';
import CommandOutput from '../components/CommandOutput.vue';
import WorkbenchLayout from '../components/WorkbenchLayout.vue';
import { buildSliceCommands, PRESETS, toTimecode } from '../ffmpeg-commands';
import type { CommandBundle, SliceSegment } from '../ffmpeg-commands';

const { t } = useI18n();

const input = ref('input.mp4');
const prefix = ref('output');
const codec = ref('libx264');
const crf = ref(23);
const preset = ref('medium');
const segments = ref<SliceSegment[]>([{ start: 0, end: 10, crop: null, scale: 'original' }]);

const fileInput = ref<HTMLInputElement | null>(null);
const localFile = ref('');
const videoRef = ref<HTMLVideoElement | null>(null);

const codecOptions = computed(() => [
  { label: t('tools.ffmpeg-workbench.slice.codecs.h264'), value: 'libx264' },
  { label: t('tools.ffmpeg-workbench.slice.codecs.h265'), value: 'libx265' },
  { label: t('tools.ffmpeg-workbench.slice.codecs.vp9'), value: 'libvpx-vp9' },
  { label: t('tools.ffmpeg-workbench.slice.codecs.copy'), value: 'copy' },
]);

const scaleOptions = computed(() => [
  { label: t('tools.ffmpeg-workbench.slice.scales.original'), value: 'original' },
  { label: t('tools.ffmpeg-workbench.slice.scales.w1920'), value: '1920:-2' },
  { label: t('tools.ffmpeg-workbench.slice.scales.w1280'), value: '1280:-2' },
  { label: t('tools.ffmpeg-workbench.slice.scales.w854'), value: '854:-2' },
  { label: t('tools.ffmpeg-workbench.slice.scales.w640'), value: '640:-2' },
  { label: t('tools.ffmpeg-workbench.slice.scales.custom'), value: 'custom' },
]);

function pickFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  localFile.value = URL.createObjectURL(file);
  input.value = file.name;
}

function useCurrentTime(index: number, field: 'start' | 'end') {
  const time = videoRef.value?.currentTime;
  if (typeof time === 'number') {
    segments.value[index][field] = Number(time.toFixed(3));
  }
}

function addSegment() {
  const last = segments.value[segments.value.length - 1];
  segments.value.push({ start: last?.end ?? 0, end: (last?.end ?? 0) + 10, crop: null, scale: 'original' });
}

function removeSegment(index: number) {
  segments.value.splice(index, 1);
  if (segments.value.length === 0) {
    addSegment();
  }
}

function toggleCrop(seg: SliceSegment) {
  seg.crop = seg.crop ? null : { w: 1920, h: 1080, x: 0, y: 0 };
}

function formatRange(seg: { start: number, end: number }) {
  return `${toTimecode(seg.start)} → ${toTimecode(seg.end)}`;
}

const useStreamCopy = computed(() => codec.value === 'copy');

const bundle = computed<CommandBundle>(() =>
  buildSliceCommands({
    input: input.value,
    prefix: prefix.value,
    codec: codec.value,
    crf: crf.value,
    preset: preset.value,
    segments: segments.value,
  }),
);
</script>

<template>
  <WorkbenchLayout :title="t('tools.ffmpeg-workbench.slice.panel')">
    <template #params>
      <div class="row">
        <span class="label">{{ t('tools.ffmpeg-workbench.common.input') }}</span>
        <n-input v-model:value="input" size="small" placeholder="input.mp4" />
        <n-button size="small" secondary @click="fileInput?.click()">
          {{ t('tools.ffmpeg-workbench.common.localPreview') }}
        </n-button>
        <input ref="fileInput" type="file" accept="video/*" class="hidden-input" @change="pickFile">
      </div>

      <video v-if="localFile" ref="videoRef" :src="localFile" controls class="preview" />

      <n-divider style="margin: 12px 0" />

      <div class="segments-head">
        <span class="label">{{ t('tools.ffmpeg-workbench.slice.segments') }}</span>
        <n-button size="tiny" secondary @click="addSegment">
          <template #icon><n-icon :component="Plus" /></template>
          {{ t('tools.ffmpeg-workbench.common.addSegment') }}
        </n-button>
      </div>

      <div v-for="(seg, i) in segments" :key="i" class="segment">
        <div class="segment__head">
          <n-tag size="small" :bordered="false">{{ t('tools.ffmpeg-workbench.slice.segment', { n: i + 1 }) }}</n-tag>
          <span class="segment__range">{{ formatRange(seg) }}</span>
          <n-button size="tiny" quaternary type="error" :disabled="segments.length === 1" @click="removeSegment(i)">
            <template #icon><n-icon :component="Trash" /></template>
          </n-button>
        </div>

        <div class="grid2">
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.slice.start') }}</span>
            <n-input-number v-model:value="seg.start" size="small" :min="0" :precision="3" />
            <n-button v-if="localFile" size="tiny" quaternary @click="useCurrentTime(i, 'start')">
              <template #icon><n-icon :component="Clock" /></template>
            </n-button>
          </div>
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.slice.end') }}</span>
            <n-input-number v-model:value="seg.end" size="small" :min="0" :precision="3" />
            <n-button v-if="localFile" size="tiny" quaternary @click="useCurrentTime(i, 'end')">
              <template #icon><n-icon :component="Clock" /></template>
            </n-button>
          </div>
        </div>

        <div class="grid2">
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.slice.scale') }}</span>
            <n-select v-model:value="seg.scale" size="small" :options="scaleOptions" :disabled="useStreamCopy" />
          </div>
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.slice.crop') }}</span>
            <n-switch :value="Boolean(seg.crop)" size="small" :disabled="useStreamCopy" @update:value="toggleCrop(seg)" />
          </div>
        </div>

        <n-input
          v-if="seg.scale === 'custom'"
          :value="seg.scale"
          size="small"
          style="margin-bottom: 8px"
          :placeholder="t('tools.ffmpeg-workbench.slice.customScalePlaceholder')"
          @update:value="v => (seg.scale = v)"
        />

        <div v-if="seg.crop" class="grid4">
          <n-input-number v-model:value="seg.crop.w" size="small" :min="1" :placeholder="t('tools.ffmpeg-workbench.common.width')" />
          <n-input-number v-model:value="seg.crop.h" size="small" :min="1" :placeholder="t('tools.ffmpeg-workbench.common.height')" />
          <n-input-number v-model:value="seg.crop.x" size="small" :min="0" placeholder="X" />
          <n-input-number v-model:value="seg.crop.y" size="small" :min="0" placeholder="Y" />
        </div>
      </div>

      <n-divider style="margin: 12px 0" />

      <div class="grid2">
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.slice.prefix') }}</span>
          <n-input v-model:value="prefix" size="small" />
        </div>
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.slice.codec') }}</span>
          <n-select v-model:value="codec" size="small" :options="codecOptions" />
        </div>
      </div>

      <div v-if="!useStreamCopy" class="grid2">
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.slice.crf') }}</span>
          <n-input-number v-model:value="crf" size="small" :min="0" :max="51" />
        </div>
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.slice.preset') }}</span>
          <n-select v-model:value="preset" size="small" :options="PRESETS.map(p => ({ label: p, value: p }))" />
        </div>
      </div>

      <n-alert v-if="useStreamCopy" type="info" size="small" style="margin-top: 12px">
        {{ t('tools.ffmpeg-workbench.slice.copyAlert') }}
      </n-alert>
    </template>

    <template #output>
      <CommandOutput :bundle="bundle" :hint="t('tools.ffmpeg-workbench.slice.empty')" />
    </template>
  </WorkbenchLayout>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 12px;
  opacity: 0.65;
  white-space: nowrap;
}

.hidden-input {
  display: none;
}

.preview {
  width: 100%;
  margin-top: 10px;
  border-radius: 6px;
  background: #000;
}

.segments-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.segment {
  border: 1px solid rgba(128, 128, 128, 0.22);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}

.segment__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.segment__range {
  font-size: 12px;
  opacity: 0.6;
  margin-left: auto;
  font-family: monospace;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
}

.grid4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}

.field {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
