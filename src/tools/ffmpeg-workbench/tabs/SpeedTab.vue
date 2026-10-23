<script setup lang="ts">
import CommandOutput from '../components/CommandOutput.vue';
import WorkbenchLayout from '../components/WorkbenchLayout.vue';
import { buildAudioTempoChain, buildReverseCommand, buildSpeedCommand } from '../ffmpeg-commands';
import type { CommandBundle } from '../ffmpeg-commands';

const { t } = useI18n();

const mode = ref<'speed' | 'reverse'>('speed');

const input = ref('input.mp4');
const speed = ref(2);
const muteAudio = ref(false);
const speedOutput = ref('output_speed.mp4');

const reverseInput = ref('input.mp4');
const reverseOutput = ref('output_reverse.mp4');
const withAudio = ref(true);

const presets = [0.25, 0.5, 1.5, 2, 4, 8];

const modes = computed(() => [
  { label: t('tools.ffmpeg-workbench.speed.modeSpeed'), value: 'speed' },
  { label: t('tools.ffmpeg-workbench.speed.modeReverse'), value: 'reverse' },
]);

const bundle = computed<CommandBundle>(() =>
  mode.value === 'speed'
    ? buildSpeedCommand({ input: input.value, speed: speed.value, muteAudio: muteAudio.value, output: speedOutput.value })
    : buildReverseCommand({ input: reverseInput.value, output: reverseOutput.value, withAudio: withAudio.value }),
);

const tempoChain = computed(() => buildAudioTempoChain(speed.value));
const ptsFactor = computed(() => (1 / (speed.value <= 0 ? 0.1 : speed.value)).toFixed(4));
</script>

<template>
  <WorkbenchLayout :title="t('tools.ffmpeg-workbench.speed.panel')">
    <template #params>
      <div class="field">
        <span class="label">{{ t('tools.ffmpeg-workbench.speed.mode') }}</span>
        <n-select v-model:value="mode" size="small" :options="modes" style="max-width: 220px" />
      </div>

      <n-divider style="margin: 12px 0" />

      <template v-if="mode === 'speed'">
        <div class="row">
          <span class="label">{{ t('tools.ffmpeg-workbench.common.input') }}</span>
          <n-input v-model:value="input" size="small" />
        </div>

        <div class="field" style="margin-top: 10px">
          <span class="label">{{ t('tools.ffmpeg-workbench.speed.speed') }}</span>
          <n-input-number v-model:value="speed" size="small" :min="0.1" :max="100" :step="0.1" style="max-width: 140px" />
          <div class="presets">
            <n-button v-for="p in presets" :key="p" size="tiny" :type="speed === p ? 'primary' : 'default'" secondary @click="speed = p">
              {{ p }}x
            </n-button>
          </div>
        </div>

        <div class="field" style="margin-top: 10px">
          <span class="label">{{ t('tools.ffmpeg-workbench.speed.audio') }}</span>
          <n-switch v-model:value="muteAudio" size="small" />
          <span class="hint">{{ muteAudio ? t('tools.ffmpeg-workbench.speed.audioMuted') : t('tools.ffmpeg-workbench.speed.audioTempo') }}</span>
        </div>

        <div class="field" style="margin-top: 10px">
          <span class="label">{{ t('tools.ffmpeg-workbench.common.output') }}</span>
          <n-input v-model:value="speedOutput" size="small" />
        </div>

        <div class="filters" v-if="!muteAudio">
          <div><b>{{ t('tools.ffmpeg-workbench.speed.videoFilter') }}：</b><code>setpts={{ ptsFactor }}*PTS</code></div>
          <div><b>{{ t('tools.ffmpeg-workbench.speed.audioFilter') }}：</b><code>{{ tempoChain }}</code></div>
          <div class="hint">{{ t('tools.ffmpeg-workbench.speed.tempoHint') }}</div>
        </div>
      </template>

      <template v-else>
        <div class="row">
          <span class="label">{{ t('tools.ffmpeg-workbench.common.input') }}</span>
          <n-input v-model:value="reverseInput" size="small" />
        </div>

        <div class="field" style="margin-top: 10px">
          <span class="label">{{ t('tools.ffmpeg-workbench.speed.reverseAudio') }}</span>
          <n-switch v-model:value="withAudio" size="small" />
          <span class="hint">{{ withAudio ? t('tools.ffmpeg-workbench.speed.reverseAudioOn') : t('tools.ffmpeg-workbench.speed.reverseAudioOff') }}</span>
        </div>

        <div class="field" style="margin-top: 10px">
          <span class="label">{{ t('tools.ffmpeg-workbench.common.output') }}</span>
          <n-input v-model:value="reverseOutput" size="small" />
        </div>

        <n-alert type="warning" size="small" style="margin-top: 12px">
          {{ t('tools.ffmpeg-workbench.speed.reverseAlert') }}
        </n-alert>
      </template>
    </template>

    <template #output>
      <CommandOutput :bundle="bundle" :hint="t('tools.ffmpeg-workbench.speed.empty')" />
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

.hint {
  font-size: 12px;
  opacity: 0.55;
}

.presets {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filters {
  margin-top: 14px;
  padding: 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.09);
  font-size: 12.5px;
  line-height: 1.9;

  code {
    font-family: monospace;
  }
}
</style>
