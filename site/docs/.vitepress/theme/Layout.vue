<script setup lang="ts">
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { nextTick, provide, computed, ref, onMounted } from "vue";
// 1. 引入你的自定义标题组件
import HeroTitle from "./components/HeroTitle.vue";

const { isDark, frontmatter } = useData();

// 使用computed让showHeroImage响应路由变化
const showHeroImage = computed(() => {
  return frontmatter.value.showHeroImage || false;
});
const showHeroLogo = computed(() => {
  if (frontmatter.value.hero) {
    return frontmatter.value.hero.showHeroLogo || false;
  }
  return false;
});

// const { isDark } = useData();

const enableTransitions = () =>
  "startViewTransition" in document &&
  window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

provide("toggle-appearance", async ({ clientX: x, clientY: y }: MouseEvent) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value;
    return;
  }

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    )}px at ${x}px ${y}px)`,
  ];

  await document.startViewTransition(async () => {
    isDark.value = !isDark.value;
    await nextTick();
  }).ready;

  document.documentElement.animate(
    { clipPath: isDark.value ? clipPath.reverse() : clipPath },
    {
      duration: 300,
      easing: "ease-in",
      fill: "forwards",
      pseudoElement: `::view-transition-${isDark.value ? "old" : "new"}(root)`,
    }
  );
});

// 检测浏览器是否支持webm格式
const supportsWebM = ref(true);

onMounted(() => {
  // 检测浏览器是否为Chrome或Firefox
  const isChrome =
    /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = typeof InstallTrigger !== "undefined";

  // 如果不是Chrome或Firefox，则使用图片
  if (!isChrome && !isFirefox) {
    supportsWebM.value = false;
  }
});
</script>


<template>
  <DefaultTheme.Layout>
    <!-- 2. 使用插槽将组件注入到 Hero 区域 -->
    <!-- 'home-hero-info-before' 会显示在原有标题的上方位置 -->
    <!-- 配合我们在 index.md 中把 name 留空，这个组件就会占据主标题位置 -->
    <!-- <template #nav-bar-title-after>
      <HeroTitle />
    </template> -->
    <template v-if="showHeroLogo" #home-hero-info-before>
      <HeroTitle />
    </template>
    <template v-if="showHeroImage" #home-hero-image>
      <!-- <video
        class="image-src"
        autoplay
        loop
        src="/videos/ffmpegplay.webm"
        alt="Hero Image"
        muted
        playbackRate="0.8"
      /> -->
      <video
        v-if="supportsWebM"
        class="image-src"
        autoplay
        loop
        muted
        playbackRate="0.8"
        alt="Hero Image"
      >
        <!-- 主要视频源 -->
        <source src="/videos/ffmpegplay.webm" type="video/webm" />
        <!-- 最终回退内容 -->
        <img src="/optimized-images/img/ffmpeg-xl.webp" alt="Hero Image" />
      </video>
      <img
        v-else
        class="image-src"
        src="/optimized-images/img/ffmpeg-xl.webp"
        alt="Hero Image"
      />
    </template>
  </DefaultTheme.Layout>
</template>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root),
.dark::view-transition-new(root) {
  z-index: 1;
}

::view-transition-new(root),
.dark::view-transition-old(root) {
  z-index: 9999;
}

.VPSwitchAppearance {
  width: 22px !important;
}

.VPSwitchAppearance .check {
  transform: none !important;
}
</style>