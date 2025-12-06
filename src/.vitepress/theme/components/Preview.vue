<script setup>
import { computed, defineProps, getCurrentInstance, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  images: {
    type: Array,
    default: () => [
    ],
  },
})
const current = ref(0)
const hiddenImages = ref(null)

function next() {
  current.value = (current.value + 1) % props.images.length
}

let timer
onMounted(() => {
  timer = setInterval(next, 2500)
})
onUnmounted(() => {
  clearInterval(timer)
})

const dotStyle = computed(() => {
  const minSize = 0.4
  const maxSize = 0.75
  const count = props.images.length
  let size = maxSize - (count - 1) * 0.07
  if
  (size < minSize)
    size = minSize

  return {
    width: `${size}rem`,
    height: `${size}rem`,
  }
})

const { proxy } = getCurrentInstance()
function openViewer() {
  if (proxy && proxy.$vImageViewer && hiddenImages.value) {
    proxy.$vImageViewer(hiddenImages.value, { index: current.value })
  }
}
</script>

<template>
  <div class="preview-card">
    <h2 class="preview-title">
      Preview
    </h2>
    <div class="preview-content">
      <div class="image-container">
        <img
          :src="images[current]"
          alt="Preview"
          style="cursor: pointer;"
          @click="openViewer"
        >
        <div class="image-overlay">
          <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M10 7v6m-3-3h6m4 0a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
        </div>
        <div class="slide-progress inside">
          <span
            v-for="(img, idx) in images"
            :key="idx"
            class="dot"
            :class="{ active: idx === current }"
            :style="dotStyle"
          />
        </div>
        <div ref="hiddenImages" style="display: none;">
          <img v-for="(img, idx) in images" :key="idx" :src="img" :alt="`Preview ${idx}`">
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-card {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--vp-shadow-2);
  width: 100%;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid var(--vp-c-bg-soft);
  overflow: hidden;
  position: relative;
}

.preview-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--vp-c-text-1);
  border: none;
  padding: 0;
  position: relative;
  background: none;
  text-align: center;
}

.preview-title::before,
.preview-title::after {
  display: none !important;
  content: none !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
  height: 0 !important;
  width: 0 !important;
  background: none !important;
}

.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-container {
  position: relative;
  width: 18rem;
  height: 10.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vp-c-bg);
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: transparent;
  display: block;
  transition: filter 0.2s;
}

.image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  background: rgba(0,0,0,0.25);
}

.image-container:hover img {
  filter: brightness(0.6);
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.magnifier-icon {
  width: 3rem;
  height: 3rem;
  opacity: 0.85;
  background: none;
}

.slide-progress {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.slide-progress.inside {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  z-index: 2;
  background: none;
}

.dot {
  border-radius: 50%;
  border: 1.5px solid var(--vp-c-brand-1);
  background: transparent;
  transition: background 0.2s, border-color 0.2s, width 0.2s, height 0.2s;
  display: inline-block;
}

.dot.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
</style>
