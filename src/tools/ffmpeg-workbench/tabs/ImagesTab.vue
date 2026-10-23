<script setup lang="ts">
import CommandOutput from '../components/CommandOutput.vue';
import WorkbenchLayout from '../components/WorkbenchLayout.vue';
import { buildBatchCropCommand, buildImagesToVideoCommand, buildTileCommand, IMAGE_FORMATS } from '../ffmpeg-commands';
import type { CommandBundle } from '../ffmpeg-commands';

const { t } = useI18n();

type SubMode = 'toVideo' | 'tile' | 'crop';

const mode = ref<SubMode>('toVideo');
const modes = computed(() => [
  { label: t('tools.ffmpeg-workbench.images.modeVideo'), value: 'toVideo' },
  { label: t('tools.ffmpeg-workbench.images.modeTile'), value: 'tile' },
  { label: t('tools.ffmpeg-workbench.images.modeCrop'), value: 'crop' },
]);

// to video
const pattern = ref('frames/frame_%04d.png');
const fps = ref(25);
const codec = ref('libx264');
const videoOutput = ref('output.mp4');

// tile
const tileInput = ref('frames/frame_%04d.png');
const columns = ref(3);
const rows = ref(3);
const tileOutput = ref('grid.png');

// batch crop
const cropDir = ref('.');
const cropOutputDir = ref('output');
const cropExt = ref('png');
const rect = ref({ x: 0, y: 0, w: 800, h: 600 });

const bundle = computed<CommandBundle>(() => {
  if (mode.value === 'toVideo') {
    return buildImagesToVideoCommand({ inputPattern: pattern.value, fps: fps.value, codec: codec.value, output: videoOutput.value });
  }
  if (mode.value === 'tile') {
    return buildTileCommand({ inputPattern: tileInput.value, columns: columns.value, rows: rows.value, output: tileOutput.value });
  }
  return buildBatchCropCommand({ inputDir: cropDir.value, outputDir: cropOutputDir.value, extension: cropExt.value, rect: rect.value });
});
</script>

<template>
  <WorkbenchLayout :title="t('tools.ffmpeg-workbench.images.panel')">
    <template #params>
      <div class="field">
        <span class="label">{{ t('tools.ffmpeg-workbench.images.mode') }}</span>
        <n-select v-model:value="mode" size="small" :options="modes" style="max-width: 240px" />
      </div>

      <n-divider style="margin: 12px 0" />

      <template v-if="mode === 'toVideo'">
        <div class="row">
          <span class="label">{{ t('tools.ffmpeg-workbench.images.sequence') }}</span>
          <n-input v-model:value="pattern" size="small" placeholder="frames/frame_%04d.png" />
        </div>
        <div class="grid2" style="margin-top: 10px">
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.images.fps') }}</span>
            <n-input-number v-model:value="fps" size="small" :min="1" :step="1" />
          </div>
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.images.codec') }}</span>
            <n-select v-model:value="codec" size="small" :options="[{ label: 'H.264', value: 'libx264' }, { label: 'H.265', value: 'libx265' }]" />
          </div>
        </div>
        <div class="row" style="margin-top: 10px">
          <span class="label">{{ t('tools.ffmpeg-workbench.common.output') }}</span>
          <n-input v-model:value="videoOutput" size="small" />
        </div>
        <n-alert type="default" size="small" style="margin-top: 12px">
          {{ t('tools.ffmpeg-workbench.images.videoAlert') }}
        </n-alert>
      </template>

      <template v-else-if="mode === 'tile'">
        <div class="row">
          <span class="label">{{ t('tools.ffmpeg-workbench.images.sequence') }}</span>
          <n-input v-model:value="tileInput" size="small" placeholder="frames/frame_%04d.png" />
        </div>
        <div class="grid2" style="margin-top: 10px">
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.images.columns') }}</span>
            <n-input-number v-model:value="columns" size="small" :min="1" :max="20" />
          </div>
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.images.rows') }}</span>
            <n-input-number v-model:value="rows" size="small" :min="1" :max="20" />
          </div>
        </div>
        <div class="row" style="margin-top: 10px">
          <span class="label">{{ t('tools.ffmpeg-workbench.common.output') }}</span>
          <n-input v-model:value="tileOutput" size="small" />
        </div>
        <n-alert type="default" size="small" style="margin-top: 12px">
          {{ t('tools.ffmpeg-workbench.images.tileAlert') }}
        </n-alert>
      </template>

      <template v-else>
        <div class="grid2">
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.images.inputDir') }}</span>
            <n-input v-model:value="cropDir" size="small" placeholder="." />
          </div>
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.images.outputDir') }}</span>
            <n-input v-model:value="cropOutputDir" size="small" />
          </div>
        </div>
        <div class="field" style="margin-top: 10px">
          <span class="label">{{ t('tools.ffmpeg-workbench.images.format') }}</span>
          <n-select v-model:value="cropExt" size="small" :options="IMAGE_FORMATS" style="max-width: 140px" />
        </div>
        <div class="grid4" style="margin-top: 10px">
          <n-input-number v-model:value="rect.w" size="small" :min="1" :placeholder="t('tools.ffmpeg-workbench.common.width')" />
          <n-input-number v-model:value="rect.h" size="small" :min="1" :placeholder="t('tools.ffmpeg-workbench.common.height')" />
          <n-input-number v-model:value="rect.x" size="small" :min="0" placeholder="X" />
          <n-input-number v-model:value="rect.y" size="small" :min="0" placeholder="Y" />
        </div>
      </template>
    </template>

    <template #output>
      <CommandOutput :bundle="bundle" :hint="t('tools.ffmpeg-workbench.images.empty')" />
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

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.grid4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
</style>
