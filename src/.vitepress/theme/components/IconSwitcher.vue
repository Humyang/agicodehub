<script setup>
import { ref, watch, onUnmounted } from "vue";

const props = defineProps({
  defaultClass: {
    type: String,
    required: true,
  },
  switchClasses: {
    type: Array,
    default: () => [],
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const currentClass = ref(props.defaultClass);
const isGlitching = ref(false);

// 用于存储定时器 ID，以便清理
let nextLoopTimer = null;
let stopGlitchTimer = null;

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);

// 切换图标
const swapIcon = () => {
  if (props.switchClasses.length === 0) return;
  const randomIndex = randomInt(0, props.switchClasses.length - 1);
  currentClass.value = props.switchClasses[randomIndex];
};

// 触发单次故障爆发
const triggerBurst = () => {
  if (!props.active) return;

  // 1. 开始故障：应用 CSS 动画，切换图标
  isGlitching.value = true;
  swapIcon();

  // 随机决定故障持续时间 (例如：100ms 到 300ms 之间，快速闪一下)
  const burstDuration = randomInt(100, 300);

  // 2. 结束故障：清除 CSS 动画，恢复默认图标或保留最后状态
  stopGlitchTimer = setTimeout(() => {
    isGlitching.value = false;
    // 如果你想在静止时恢复默认图标，取消下面这行的注释
    // currentClass.value = props.defaultClass;

    // 3. 安排下一次故障：随机等待一段时间 (例如：1秒 到 3秒)
    if (props.active) {
      const nextDelay = randomInt(1000, 3000);
      nextLoopTimer = setTimeout(triggerBurst, nextDelay);
    }
  }, burstDuration);
};

const startEngine = () => {
  if (props.switchClasses.length === 0) return;
  // 鼠标移入时，立即触发一次，不需要等待
  triggerBurst();
};

const stopEngine = () => {
  // 清除所有待执行的定时器
  clearTimeout(nextLoopTimer);
  clearTimeout(stopGlitchTimer);

  // 重置状态
  isGlitching.value = false;
  currentClass.value = props.defaultClass;
};

// 监听 active 变化
watch(
  () => props.active,
  (newVal) => {
    if (newVal) {
      startEngine();
    } else {
      stopEngine();
    }
  }
);

onUnmounted(() => {
  stopEngine();
});
</script>
<template>
  <div class="switcher-wrapper">
    <i
      :class="[currentClass, { glitching: isGlitching }]"
      class="target-icon"
    ></i>
  </div>
</template>

<style scoped>
/* 保持原有的 CSS 不变 */

.switcher-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.target-icon {
  display: inline-block;
  transition: transform 0.1s;
  /* transform: scale(1.5); */
  /* filter: contrast(1.2) brightness(1.2); */
  /* position: relative; */
}

/* 激活故障时的 Class */
.glitching {
  animation: shake-hard 0.2s infinite linear;
  /* 色差分离滤镜 */
  text-shadow: 2px 0 #ff003c, -2px 0 #00d2ff;
  filter: drop-shadow(2px 0px 0px rgba(255, 0, 60, 0.7))
    drop-shadow(-2px 0px 0px rgba(0, 210, 255, 0.7));
  position: relative;
  transform: scale(3.5);
  filter: contrast(2) brightness(5);
  position: relative;
}

/* 伪元素用于制造重影/残像 */
.glitching::before,
.glitching::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: inherit;
  /* 继承Sprite背景 */
  opacity: 0.5;
}

.glitching::before {
  transform: translate(-5px, 0);
  animation: tear 0.3s infinite reverse;
  mix-blend-mode: screen;
}

.glitching::after {
  transform: translate(5px, 0);
  animation: tear 0.4s infinite;
  mix-blend-mode: multiply;
}

/* 剧烈抖动 */
@keyframes shake-hard {
  0% {
    transform: translate(1px, 1px) skewX(0deg);
  }

  10% {
    transform: translate(-3px, -2px) skewX(-5deg);
  }

  20% {
    transform: translate(-3px, 0px) skewX(3deg) scale(3.5);
  }

  30% {
    transform: translate(3px, 2px) skewX(0deg);
  }

  40% {
    transform: translate(1px, -1px) skewX(1deg);
  }

  50% {
    transform: translate(-1px, 2px) skewX(-1deg);
  }

  60% {
    transform: translate(-3px, 1px) skewX(0deg);
  }

  70% {
    transform: translate(3px, 1px) skewX(-2deg);
  }

  80% {
    transform: translate(-1px, -1px) skewX(1deg);
  }

  90% {
    transform: translate(1px, 2px) skewX(0deg);
  }

  100% {
    transform: translate(1px, -2px) skewX(-1deg);
  }
}

/* 撕裂效果 */
@keyframes tear {
  0% {
    clip-path: inset(0 0 0 0);
  }

  20% {
    clip-path: inset(10% 0 30% 0);
    transform: translate(-5px, 0);
  }

  40% {
    clip-path: inset(50% 0 10% 0);
    transform: translate(5px, 0);
  }

  60% {
    clip-path: inset(0 0 60% 0);
    transform: translate(-5px, 0);
  }

  80% {
    clip-path: inset(20% 0 20% 0);
    transform: translate(5px, 0);
  }

  100% {
    clip-path: inset(0 0 0 0);
  }
}
</style>