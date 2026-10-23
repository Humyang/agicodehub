<script setup lang="ts">
import { Copy, Check, FileText } from '@vicons/tabler';
import { useThemeVars } from 'naive-ui';
import type { CommandBundle } from '../ffmpeg-commands';

const props = defineProps<{ bundle: CommandBundle; hint?: string }>();

const themeVars = useThemeVars();
const { t } = useI18n();
const copied = ref('');

const code = computed(() => props.bundle.commands.join('\n\n').trim());
const scripts = computed(() => props.bundle.scripts.filter(s => s.code.trim()));

async function copy(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = key;
    setTimeout(() => (copied.value = copied.value === key ? '' : copied.value), 1500);
  }
  catch {
    copied.value = '';
  }
}
</script>

<template>
  <n-card size="small" :title="t('tools.ffmpeg-workbench.common.commandTitle')" :bordered="false">
    <div v-if="code" class="code-block" :style="{ background: themeVars.codeColor, color: themeVars.textColorBase }">
      <pre>{{ code }}</pre>
      <n-button class="copy-btn" size="tiny" quaternary @click="copy(code, 'main')">
        <template #icon>
          <n-icon :component="copied === 'main' ? Check : Copy" />
        </template>
        {{ copied === 'main' ? t('tools.ffmpeg-workbench.common.copied') : t('tools.ffmpeg-workbench.common.copy') }}
      </n-button>
    </div>

    <n-empty v-else size="small" :description="hint ?? t('tools.ffmpeg-workbench.common.emptyDefault')" class="empty" />

    <template v-if="scripts.length">
      <div class="scripts-title">
        <n-icon :component="FileText" />
        <span>{{ t('tools.ffmpeg-workbench.common.batchTitle') }}</span>
      </div>

      <n-collapse>
        <n-collapse-item v-for="s in scripts" :key="s.label" :title="s.label" :name="s.label">
          <div class="code-block" :style="{ background: themeVars.codeColor, color: themeVars.textColorBase }">
            <pre>{{ s.code }}</pre>
            <n-button class="copy-btn" size="tiny" quaternary @click="copy(s.code, s.label)">
              <template #icon>
                <n-icon :component="copied === s.label ? Check : Copy" />
              </template>
              {{ copied === s.label ? t('tools.ffmpeg-workbench.common.copied') : t('tools.ffmpeg-workbench.common.copy') }}
            </n-button>
          </div>
        </n-collapse-item>
      </n-collapse>
    </template>
  </n-card>
</template>

<style scoped>
.code-block {
  position: relative;
  border-radius: 6px;
  padding: 12px;

  pre {
    margin: 0;
    font-family: v-mono, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12.5px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 46vh;
    overflow: auto;
  }
}

.copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0.25;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 1;
  }
}

.code-block:hover .copy-btn {
  opacity: 0.85;
}

.empty {
  padding: 24px 0;
}

.scripts-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 16px 0 4px;
  font-size: 13px;
  opacity: 0.7;
}
</style>
