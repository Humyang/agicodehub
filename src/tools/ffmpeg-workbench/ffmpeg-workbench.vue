<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import ExtractTab from './tabs/ExtractTab.vue';
import ImagesTab from './tabs/ImagesTab.vue';
import MaskTab from './tabs/MaskTab.vue';
import OverlayTab from './tabs/OverlayTab.vue';
import SliceTab from './tabs/SliceTab.vue';
import SpeedTab from './tabs/SpeedTab.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const tabs = computed(() => [
  { name: 'slice', label: t('tools.ffmpeg-workbench.tabs.slice'), component: SliceTab },
  { name: 'extract', label: t('tools.ffmpeg-workbench.tabs.extract'), component: ExtractTab },
  { name: 'speed', label: t('tools.ffmpeg-workbench.tabs.speed'), component: SpeedTab },
  { name: 'images', label: t('tools.ffmpeg-workbench.tabs.images'), component: ImagesTab },
  { name: 'overlay', label: t('tools.ffmpeg-workbench.tabs.overlay'), component: OverlayTab },
  { name: 'mask', label: t('tools.ffmpeg-workbench.tabs.mask'), component: MaskTab },
]);

/** Legacy standalone pages now open the matching tab of the unified workbench. */
const LEGACY_TAB: Record<string, string> = {
  '/ffmpeg-slicing-workshop': 'slice',
  '/ffmpeg-slicing-workshop-en': 'slice',
  '/ffmpeg-align-media': 'slice',
  '/ffmpeg-speed-frame': 'speed',
  '/ffmpeg-combo': 'extract',
  '/ffmpeg-overlay-generator': 'overlay',
  '/ffmpeg-video-mask': 'mask',
};

const active = ref<string>('slice');

function hasTab(name: string): boolean {
  return tabs.value.some(tab => tab.name === name);
}

function resolveInitialTab(): string {
  const fromQuery = typeof route.query.tab === 'string' ? route.query.tab : '';
  if (hasTab(fromQuery)) {
    return fromQuery;
  }
  const redirectedFrom = route.redirectedFrom?.path;
  if (redirectedFrom && LEGACY_TAB[redirectedFrom]) {
    return LEGACY_TAB[redirectedFrom];
  }
  return 'slice';
}

active.value = resolveInitialTab();

watch(active, (value) => {
  if (route.query.tab !== value) {
    router.replace({ path: route.path, query: { ...route.query, tab: value } });
  }
});

watch(() => route.query.tab, (tab) => {
  if (typeof tab === 'string' && tab !== active.value && hasTab(tab)) {
    active.value = tab;
  }
});
</script>

<template>
  <div class="workbench">
    <n-tabs v-model:value="active" type="line" animated size="large" display-directive="show:lazy">
      <n-tab-pane v-for="tab in tabs" :key="tab.name" :name="tab.name" :tab="tab.label">
        <component :is="tab.component" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.workbench {
  width: 100%;
}
</style>
