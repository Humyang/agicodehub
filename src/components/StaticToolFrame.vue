<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  /** Either a single page, or a per-language pair of pages. */
  src: string | Partial<Record<'zh' | 'en', string>>
  title?: string
}>();

const { t, locale } = useI18n();

const iframe = ref<HTMLIFrameElement | null>(null);

// BASE_URL is a relative path (e.g. '/'), which cannot be used as the base of
// `new URL()`. Build the public path with plain string concatenation instead so
// the tool also works when the app is deployed under a sub-path.
const normalizedBase = () => {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
};

const withBase = (src: string) => {
  if (/^https?:\/\//i.test(src)) {
    return src;
  }
  return `${normalizedBase()}${src.replace(/^\/+/, '')}`;
};

const rawSrc = computed(() => {
  if (typeof props.src === 'string') {
    return props.src;
  }
  return (locale.value === 'zh' ? props.src.zh : props.src.en) ?? props.src.en ?? props.src.zh ?? '';
});

const frameSrc = computed(() => withBase(rawSrc.value));

// Pages that exist in two language versions must be reloaded when the language
// changes; pages translated at runtime keep their state and are updated live.
const frameKey = computed(() => (typeof props.src === 'string' ? 'single' : rawSrc.value));

/** Ask the embedded page to (re-)apply the current language without reloading. */
function pushLocale() {
  const win = iframe.value?.contentWindow as (Window & { __legacyI18n?: { apply: (l: string) => void } }) | null;
  if (!win) {
    return;
  }
  try {
    win.__legacyI18n?.apply(locale.value);
    win.postMessage({ type: 'legacy-i18n', locale: locale.value }, '*');
  }
  catch {
    // Cross-origin embed: the page handles its own language.
  }
}

watch(locale, () => pushLocale());

const openInNewTab = () => window.open(frameSrc.value, '_blank');
</script>

<template>
  <div class="static-tool-frame">
    <iframe
      :key="frameKey"
      ref="iframe"
      :src="frameSrc"
      :title="title ?? rawSrc"
      class="static-tool-frame__iframe"
      allow="clipboard-read; clipboard-write; fullscreen"
      allowfullscreen
      @load="pushLocale"
    />
    <button class="static-tool-frame__open" type="button" :title="t('staticTool.openInNewWindow')" @click="openInNewTab">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </button>
  </div>
</template>

<style scoped lang="less">
.static-tool-frame {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  // Fill the viewport: minus the top navbar and the page paddings.
  height: calc(100vh - 104px);
  min-height: 420px;

  &__iframe {
    flex: 1;
    width: 100%;
    border: none;
    border-radius: 4px;
    background: #fff;
  }

  // Zero-height chrome: only visible on hover, so the tool gets the whole area.
  &__open {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    color: #4b5563;
    cursor: pointer;
    background: rgb(255 255 255 / 90%);
    border: 1px solid rgb(0 0 0 / 8%);
    border-radius: 6px;
    box-shadow: 0 1px 4px rgb(0 0 0 / 12%);
    opacity: 0;
    transition: opacity 0.2s ease;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      color: #18a058;
    }
  }

  &:hover &__open {
    opacity: 1;
  }
}
</style>
