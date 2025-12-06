<template>
  <div
    v-if="isTransitioning"
    ref="videoContainer"
    class="theme-transition-container"
    :style="{ display: containerReady ? 'flex' : 'none' }"
  >
    <video
      autoplay
      muted
      playsinline
      class="transition-video"
      @ended="onTransitionEnd"
      @loadedmetadata="setPlaybackRate"
    >
      <source :src="transitionVideo" type="video/webm" />
    </video>
  </div>
</template>


<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import { useData } from "vitepress";

const { isDark } = useData();
const isTransitioning = ref(false);
const containerReady = ref(false);
const transitionVideo = ref("");
const videoContainer = ref(null);

// Set playback rate to 10x
const setPlaybackRate = (event) => {
  // event.target.playbackRate = 0.1;
  event.target.playbackRate = 5;
};

// 将视频容器移动到 .image-container 内

const moveToImageContainer = () => {
  const imageContainer = document.querySelector(".image-container");
  if (imageContainer && videoContainer.value) {
    imageContainer.appendChild(videoContainer.value);
    containerReady.value = true;
    console.log("成功移动到 .image-container");
  } else {
    console.log("container not found, retrying...");
    // setTimeout(moveToImageContainer, 100);
  }
};
// 监听 videoContainer 引用变化
watch(videoContainer, (newVal) => {
  if (newVal && !containerReady.value) {
    moveToImageContainer();
  }
});

onMounted(() => {
  // 使用 nextTick 确保 DOM 已更新
  nextTick(() => {
    moveToImageContainer();
  });
});

watch(isDark, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    if (!containerReady.value) {
      moveToImageContainer();
    }

    isTransitioning.value = true;

    // 修复：根据切换方向选择正确的视频
    transitionVideo.value = newVal
      ? "/videos/light-to-dark.webm" // 从亮到暗
      : "/videos/dark-to-light.webm"; // 从暗到亮
  }
});

const onTransitionEnd = () => {
  isTransitioning.value = false;
};
</script>

<style scoped>
.theme-transition-container {
  position: absolute;
  /* top: -11px; */
  /* left: -16px; */

  /* width: 105%;
  height: 105%; */
  width: 320px;
  height: 320px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent; /* 添加透明背景 */
}

.transition-video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  background: transparent; /* 确保视频本身背景也是透明的 */
  mix-blend-mode: screen;
}
</style>