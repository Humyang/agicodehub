<script setup lang="ts">
import { Plus, Trash } from '@vicons/tabler';
import CommandOutput from '../components/CommandOutput.vue';
import WorkbenchLayout from '../components/WorkbenchLayout.vue';
import { buildMaskCommands } from '../ffmpeg-commands';
import type { CommandBundle, MaskStep, MaskStepType } from '../ffmpeg-commands';

const { t } = useI18n();

const input = ref('input.mp4');
const output = ref('output_masked.mp4');
const maskExt = ref('mp4');

const stepTypes = computed(() => [
  { label: t('tools.ffmpeg-workbench.mask.typeChromakey'), value: 'chromakey' },
  { label: t('tools.ffmpeg-workbench.mask.typeColorkey'), value: 'colorkey' },
  { label: t('tools.ffmpeg-workbench.mask.typeAlphamask'), value: 'alphamask' },
]);

const steps = ref<MaskStep[]>([
  { type: 'chromakey', color: '#00ff00', similarity: 0.01, blend: 0, maskFile: '', output: 'step1.mp4' },
]);

function addStep() {
  const index = steps.value.length;
  steps.value.push({
    type: 'colorkey',
    color: '#00ff00',
    similarity: 0.01,
    blend: 0,
    maskFile: '',
    output: `step${index + 1}.${maskExt.value}`,
  });
}

function removeStep(i: number) {
  steps.value.splice(i, 1);
  if (steps.value.length === 0) {
    addStep();
  }
}

function onTypeChange(step: MaskStep) {
  if (!step.output) {
    step.output = `step.${maskExt.value}`;
  }
}

const bundle = computed<CommandBundle>(() =>
  buildMaskCommands({ input: input.value, output: output.value, maskExt: maskExt.value, steps: steps.value }),
);
</script>

<template>
  <WorkbenchLayout :title="t('tools.ffmpeg-workbench.mask.panel')">
    <template #params>
      <div class="row">
        <span class="label">{{ t('tools.ffmpeg-workbench.common.input') }}</span>
        <n-input v-model:value="input" size="small" />
      </div>
      <div class="grid2" style="margin-top: 10px">
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.mask.finalOutput') }}</span>
          <n-input v-model:value="output" size="small" />
        </div>
        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.mask.ext') }}</span>
          <n-input v-model:value="maskExt" size="small" style="max-width: 100px" />
        </div>
      </div>

      <n-divider style="margin: 12px 0" />

      <div class="steps-head">
        <span class="label">{{ t('tools.ffmpeg-workbench.mask.steps') }}</span>
        <n-button size="tiny" secondary @click="addStep">
          <template #icon><n-icon :component="Plus" /></template>
          {{ t('tools.ffmpeg-workbench.common.addStep') }}
        </n-button>
      </div>

      <div v-for="(step, i) in steps" :key="i" class="segment">
        <div class="segment__head">
          <n-tag size="small" :bordered="false">{{ t('tools.ffmpeg-workbench.mask.step', { n: i + 1 }) }}</n-tag>
          <n-button size="tiny" quaternary type="error" :disabled="steps.length === 1" @click="removeStep(i)">
            <template #icon><n-icon :component="Trash" /></template>
          </n-button>
        </div>

        <div class="field">
          <span class="label">{{ t('tools.ffmpeg-workbench.mask.type') }}</span>
          <n-select v-model:value="step.type" size="small" :options="stepTypes" @update:value="onTypeChange(step)" />
        </div>

        <div v-if="step.type === 'alphamask'" class="row" style="margin-top: 8px">
          <span class="label">{{ t('tools.ffmpeg-workbench.mask.maskFile') }}</span>
          <n-input v-model:value="step.maskFile" size="small" placeholder="mask.png" />
        </div>

        <div class="grid2" style="margin-top: 8px">
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.mask.keyColor') }}</span>
            <n-color-picker v-model:value="step.color" size="small" :modes="['hex']" :show-alpha="false" />
          </div>
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.mask.stepOutput') }}</span>
            <n-input v-model:value="step.output" size="small" />
          </div>
        </div>

        <div class="grid2" style="margin-top: 8px">
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.mask.similarity') }}</span>
            <n-slider v-model:value="step.similarity" :min="0.001" :max="1" :step="0.001" style="max-width: 130px" />
          </div>
          <div class="field">
            <span class="label">{{ t('tools.ffmpeg-workbench.mask.blend') }}</span>
            <n-slider v-model:value="step.blend" :min="0" :max="1" :step="0.01" style="max-width: 130px" />
          </div>
        </div>
        <div class="values">similarity={{ step.similarity.toFixed(3) }} · blend={{ step.blend.toFixed(3) }}</div>
      </div>

      <n-alert type="default" size="small">
        {{ t('tools.ffmpeg-workbench.mask.stepsAlert') }}
      </n-alert>
    </template>

    <template #output>
      <CommandOutput :bundle="bundle" :hint="t('tools.ffmpeg-workbench.mask.empty')" />
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

.segment {
  border: 1px solid rgba(128, 128, 128, 0.22);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}

.segment__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.steps-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.values {
  margin-top: 4px;
  font-size: 11.5px;
  opacity: 0.5;
  font-family: monospace;
}
</style>
