<template>
  <div class="gem-gemFeatures">
    <div
      v-for="(feature, index) in gemFeatures"
      :key="index"
      class="gem-container"
    >
      <div class="gem" @mouseenter="hoverGem(index)" @mouseleave="resetGem">
        <div class="gem-facet">
          <div class="gem-content">
            <h3 class="gem-title">{{ feature.title }}</h3>
            <p class="gem-details">{{ feature.details }}</p>
          </div>
          <div class="gem-reflection"></div>
          <div class="gem-sparkle sparkle-1"></div>
          <div class="gem-sparkle sparkle-2"></div>
          <div class="gem-sparkle sparkle-3"></div>
          <div class="gem-sparkle sparkle-4"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useData } from "vitepress";

const { frontmatter } = useData();
const gemFeatures = frontmatter.value.gemFeatures;

const hoverGem = (index) => {
  // 可以添加悬停效果逻辑
  console.log(`Hovering gem ${index}`);
};

const resetGem = () => {
  // 重置效果
};
</script>

<style scoped>
.gem-gemFeatures {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 40px;
  padding: 40px 20px;
  /* background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); */
}

.gem-container {
  text-align: center;
  max-width: 250px;
}

.gem {
  width: 260px;
  height: 200px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
  cursor: pointer;
  margin: 0 auto;
  color: #ffffff;
}

.gem:hover {
  transform: rotateY(15deg) rotateX(10deg);
}

.gem-facet {
  position: absolute;
  width: 100%;
  height: 100%;
  /* background: linear-gradient(
    45deg,
    rgba(13, 71, 161, 0.7) 0%,
    rgba(21, 101, 192, 0.8) 30%,
    rgba(66, 165, 245, 0.9) 50%,
    rgba(100, 181, 246, 0.7) 70%,
    rgba(144, 202, 249, 0.6) 100%
  ); */
  background: linear-gradient(43deg, #b1e8fc 0%, #13c2fd 46%, #00ff84 100%);
  /* background: linear-gradient(43deg, #0b0b0b 0%, #0b0b0b 46%, #fff7e4 100%); */
  border-radius: 10% 40% 10% 40%;
  box-shadow: 0 0 20px rgba(66, 165, 245, 0.6),
    inset 0 0 20px rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(5px);
  overflow: hidden;
}
.dark .gem-facet {
  /* background: linear-gradient(43deg, #b1e8fc 0%, #13c2fd 46%, #00ff84 100%); */

  background: linear-gradient(43deg, #0b0b0b 0%, #0b0b0b 46%, #fff7e4 100%);
}

.gem-facet::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.2) 40%,
    transparent 70%
  );
  transform: rotate(45deg);
  animation: shine 3s infinite linear;
}

.gem-facet::after {
  content: "";
  position: absolute;
  top: 10%;
  left: 10%;
  width: 80%;
  height: 80%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5% 30% 5% 30%;
  filter: blur(5px);
}

.gem-reflection {
  position: absolute;
  top: 15%;
  left: 15%;
  width: 30%;
  height: 30%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  filter: blur(8px);
  transform: rotate(15deg);
}

.gem-sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  filter: blur(1px);
  animation: sparkle 2s infinite;
}

.sparkle-1 {
  top: 20%;
  left: 25%;
  animation-delay: 0s;
}

.sparkle-2 {
  top: 60%;
  left: 70%;
  animation-delay: 0.5s;
}

.sparkle-3 {
  top: 40%;
  left: 50%;
  animation-delay: 1s;
}

.sparkle-4 {
  top: 75%;
  left: 30%;
  animation-delay: 1.5s;
}

@keyframes shine {
  0% {
    transform: rotate(45deg) translateX(-100%);
  }
  100% {
    transform: rotate(45deg) translateX(100%);
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.title {
  color: white;
  text-align: center;
  margin-top: 15px;
  margin-bottom: 10px;
  font-weight: 300;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(66, 165, 245, 0.7);
  font-size: 1.2rem;
}

.details {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
}
.gem-title {
  font-size: 26px;
}
p.gem-details {
  width: 250px;
  padding: 0 20px;
}
</style>