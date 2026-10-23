<script setup lang="ts">
import { Plus, Trash } from '@vicons/tabler';
import BoxCanvas from '../components/BoxCanvas.vue';
import CommandOutput from '../components/CommandOutput.vue';
import WorkbenchLayout from '../components/WorkbenchLayout.vue';
import { buildOverlayCommands } from '../ffmpeg-commands';
import type { Box, CommandBundle, OverlayMode } from '../ffmpeg-commands';

const { t } = useI18n();

const mode = ref<OverlayMode>('delogo');
const modes = computed(() => [
  { label: t('tools.ffmpeg-workbench.overlay.modeDelogo'), value: 'delogo' },
  { label: t('tools.ffmpeg-workbench.overlay.modeOverlay'), value: 'overlay' },
  { label: t('tools.ffmpeg-workbench.overlay.modeBorder'), value: 'border' },
  { label: t('tools.ffmpeg-workbench.overlay.modeEraser'), value: 'eraser' },
]);

const input = ref('input.mp4');
const outputName = ref('output_delogo');
const outputExt = ref('mp4');
const color = ref('#000000');
const opacity = ref(1);
const thickness = ref(8);
const keepAudio = ref(true);
const singleFrame = ref(false);

const boxes = ref<Box[]>([{ x: 100, y: 60, w: 360, h: 120 }]);

const fileInput = ref<HTMLInputElement | null>(null);
const localFile = ref('');
const isVideo = ref(true);

function pickFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  localFile.value = URL.createObjectURL(file);
  input.value = file.name;
  isVideo.value = file.type.startsWith('video');
}

function onNaturalSize({ w, h }: { w: number, h: number }) {
  // First frame sizes the default box to something sensible.
  if (boxes.value.length === 1 && boxes.value[0].w > w) {
    boxes.value[0] = { x: Math.round(w * 0.1), y: Math.round(h * 0.1), w: Math.round(w * 0.3), h: Math.round(h * 0.15) };
  }
}

function addBox() {
  boxes.value.push({ x: 0, y: 0, w: 200, h: 100 });
}

function removeBox(i: number) {
  boxes.value.splice(i, 1);
  if (boxes.value.length === 0) {
    addBox();
  }
}

function syncMode() {
  const suffix: Record<OverlayMode, string> = { overlay: 'overlay', border: 'border', delogo: 'delogo', eraser: 'eraser' };
  outputName.value = `output_${suffix[mode.value]}`;
}
watch(mode, syncMode);

const bundle = computed<CommandBundle>(() =>
  buildOverlayCommands({
    input: input.value,
    mode: mode.value,
    boxes: boxes.value,
    color: color.value,
    opacity: opacity.value,
    thickness: thickness.value,
    keepAudio: keepAudio.value,
    singleFrame: singleFrame.value,
    outputName: outputName.value,
    outputExt: outputExt.value,
  }),
);
</script>

<template>
  <WorkbenchLayout :title="t('tools.ffmpeg-workbench.overlay.panel')">
    <template #params>
      <div class="field">
        <span class="label">{{ t('tools.ffmpeg-workbench.overlay.mode') }}</span>
        <n-select v-model:value="mode" size="small" :options="modes" />
      </div>

      <n-divider style="margin: 12px 0" />

      <div class="row">
        <span class="label">{{ t('tools.ffmpeg-workbench.common.input') }}</span>
        <n-input v-model:value="input" size="small" />
        <n-button size="small" secondary @click="fileInput?.click()">
          {{ t('tools.ffmpeg-workbench.common.pickLocal') }}
        </n-button>
        <input ref="fileInput" type="file" accept="video/*,image/*" class="hidden-input" @change="pickFile">
      </div>

      <div v-if="mode === 'overlay' || mode === 'border'" class="grid2" style="margin-top: 10px">
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.overlay.color') }}</span>
          <n-color-picker v-model:value="color" size="small" :modes="['hex']" :show-alpha="false" />
        </div>
        <div v-if="mode === 'overlay'" class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.overlay.opacity') }}</span>
          <n-slider v-model:value="opacity" :min="0.05" :max="1" :step="0.05" style="max-width: 120px" />
        </div>
        <div v-else class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.overlay.thickness') }}</span>
          <n-input-number v-model:value="thickness" size="small" :min="1" style="max-width: 110px" />
        </div>
      </div>

      <n-divider style="margin: 12px 0" />

      <div class="boxes-head">
        <span class="label">{{ t('tools.ffmpeg-workbench.overlay.boxes', { n: boxes.length }) }}</span>
        <n-button size="tiny" secondary @click="addBox">
          <template #icon><n-icon :component="Plus" /></template>
          {{ t('tools.ffmpeg-workbench.common.addRegion') }}
        </n-button>
      </div>

      <div v-for="(b, i) in boxes" :key="i" class="box-row">
        <n-tag size="small" :bordered="false">{{ i + 1 }}</n-tag>
        <n-input-number v-model:value="b.x" size="small" :min="0" placeholder="X" />
        <n-input-number v-model:value="b.y" size="small" :min="0" placeholder="Y" />
        <n-input-number v-model:value="b.w" size="small" :min="1" :placeholder="t('tools.ffmpeg-workbench.common.width')" />
        <n-input-number v-model:value="b.h" size="small" :min="1" :placeholder="t('tools.ffmpeg-workbench.common.height')" />
        <n-button size="tiny" quaternary type="error" :disabled="boxes.length === 1" @click="removeBox(i)">
          <template #icon><n-icon :component="Trash" /></template>
        </n-button>
      </div>

      <n-divider style="margin: 12px 0" />

      <div class="grid2">
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.overlay.outputName') }}</span>
          <n-input v-model:value="outputName" size="small" />
        </div>
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.overlay.outputExt') }}</span>
          <n-input v-model:value="outputExt" size="small" style="max-width: 100px" />
        </div>
      </div>

      <div class="switches">
        <label class="switch">
          <n-switch v-model:value="keepAudio" size="small" />
          <span>{{ t('tools.ffmpeg-workbench.overlay.keepAudio') }}</span>
        </label>
        <label class="switch">
          <n-switch v-model:value="singleFrame" size="small" />
          <span>{{ t('tools.ffmpeg-workbench.overlay.singleFrame') }}</span>
        </label>
      </div>
    </template>

    <template #aside>
      <n-card size="small" :title="t('tools.ffmpeg-workbench.overlay.canvasTitle')" :bordered="false">
        <BoxCanvas v-model="boxes" :src="localFile" :is-video="isVideo" @update:natural-size="onNaturalSize" />
      </n-card>
    </template>

    <template #output>
      <CommandOutput :bundle="bundle" :hint="t('tools.ffmpeg-workbench.overlay.empty')" />
    </template>
  </WorkbenchLayout>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field {
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

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.boxes-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.box-row {
  display: grid;
  grid-template-columns: auto repeat(4, minmax(0, 1fr)) auto;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}

.switches {
  display: flex;
  gap: 18px;
  margin-top: 12px;
}

.switch {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
}
</style>
