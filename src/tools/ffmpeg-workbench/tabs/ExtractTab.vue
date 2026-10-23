<script setup lang="ts">
import { Clock } from '@vicons/tabler';
import CommandOutput from '../components/CommandOutput.vue';
import WorkbenchLayout from '../components/WorkbenchLayout.vue';
import { buildExtractCommands, IMAGE_FORMATS, toTimecode } from '../ffmpeg-commands';
import type { CommandBundle, ExtractMethod } from '../ffmpeg-commands';

const { t } = useI18n();

const input = ref('input.mp4');
const method = ref<ExtractMethod>('fps');
const timestamp = ref('00:00:00.000');
const fps = ref(1);
const outDir = ref('frames');
const pattern = ref('frame');
const format = ref('png');

const fileInput = ref<HTMLInputElement | null>(null);
const localFile = ref('');
const videoRef = ref<HTMLVideoElement | null>(null);

const methods = computed(() => [
  { label: t('tools.ffmpeg-workbench.extract.methodSingle'), value: 'single' },
  { label: t('tools.ffmpeg-workbench.extract.methodFps'), value: 'fps' },
  { label: t('tools.ffmpeg-workbench.extract.methodAll'), value: 'all' },
]);

function pickFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  localFile.value = URL.createObjectURL(file);
  input.value = file.name;
}

function grabCurrentTime() {
  const time = videoRef.value?.currentTime;
  if (typeof time === 'number') {
    timestamp.value = toTimecode(time);
  }
}

const bundle = computed<CommandBundle>(() =>
  buildExtractCommands({
    input: input.value,
    method: method.value,
    timestamp: timestamp.value,
    fps: fps.value,
    outDir: outDir.value,
    pattern: pattern.value,
    format: format.value,
  }),
);
</script>

<template>
  <WorkbenchLayout :title="t('tools.ffmpeg-workbench.extract.panel')">
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

      <div class="field">
        <span class="label">{{ t('tools.ffmpeg-workbench.extract.method') }}</span>
        <n-select v-model:value="method" size="small" :options="methods" />
      </div>

      <div v-if="method === 'single'" class="row" style="margin-top: 8px">
        <span class="label">{{ t('tools.ffmpeg-workbench.extract.timestamp') }}</span>
        <n-input v-model:value="timestamp" size="small" placeholder="00:00:05.000" />
        <n-button v-if="localFile" size="small" secondary @click="grabCurrentTime">
          <template #icon><n-icon :component="Clock" /></template>
          {{ t('tools.ffmpeg-workbench.extract.grabCurrent') }}
        </n-button>
      </div>

      <div v-if="method === 'fps'" class="field" style="margin-top: 8px">
        <span class="label">{{ t('tools.ffmpeg-workbench.extract.fps') }}</span>
        <n-input-number v-model:value="fps" size="small" :min="0.1" :step="1" />
        <span class="hint">{{ t('tools.ffmpeg-workbench.extract.fpsHint') }}</span>
      </div>

      <n-divider style="margin: 12px 0" />

      <div class="grid2">
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.extract.outDir') }}</span>
          <n-input v-model:value="outDir" size="small" placeholder="frames" />
        </div>
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.extract.pattern') }}</span>
          <n-input v-model:value="pattern" size="small" placeholder="frame" />
        </div>
      </div>

      <div class="field" style="margin-top: 8px">
        <span class="label">{{ t('tools.ffmpeg-workbench.extract.format') }}</span>
        <n-select v-model:value="format" size="small" :options="IMAGE_FORMATS" style="max-width: 160px" />
      </div>

      <n-alert type="default" size="small" style="margin-top: 12px">
        {{ t('tools.ffmpeg-workbench.extract.namingAlert', { dir: outDir || '.', prefix: pattern, ext: format }) }}
      </n-alert>
    </template>

    <template #output>
      <CommandOutput :bundle="bundle" :hint="t('tools.ffmpeg-workbench.extract.empty')" />
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

.hint {
  font-size: 12px;
  opacity: 0.55;
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

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.field {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
