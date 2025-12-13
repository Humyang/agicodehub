<script setup>
import { useData, withBase } from "vitepress";
import { nextTick, provide, computed, ref, onMounted } from "vue";
import IconSwitcher from "./IconSwitcher.vue";
// 获取页面 Frontmatter 数据
const { frontmatter } = useData();
const hoveredCard = ref(null);
const hasSwitchEffect = (item) => {
  return (
    item.switchIcons &&
    Array.isArray(item.switchIcons) &&
    item.switchIcons.length > 0
  );
};
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
// 基本跳转
const navigateToStaticPage = (item) => {
  if (item.link) {
    window.location.href = withBase(item.link);
  }
};

// 新标签页打开
const openInNewTab = (item, event) => {
  event.preventDefault();
  if (item.link) {
    window.open(withBase(item.link), "_blank");
  }
};
// 处理点击事件
const handleClick = (item, event) => {
  if (item.openInNewTab) {
    openInNewTab(item, event);
  } else {
    navigateToStaticPage(item);
  }
};
</script>

<template>
  <div class="home-category-grid">
    <a
      v-for="(item, index) in frontmatter.categories"
      :key="index"
      :href="withBase(item.link)"
      class="cat-card"
      :class="`theme-${item.theme || 'default'}`"
      @click="handleClick(item, $event)"
      :target="item.openInNewTab ? '_blank' : '_self'"
      @mouseenter="hoveredCard = `${index}-${index}`"
      @mouseleave="hoveredCard = null"
    >
      <i class="fa-solid fa-arrow-right arrow-icon"></i>
      <div class="cat-header">
        <div class="icon-box" v-if="item.iconType">
          <!-- <i :class="item.icon"></i> -->

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
            <source :src="`/videos/${item.iconType}.webm`" type="video/webm" />
            <!-- 最终回退内容 -->
          </video>
          <img
            v-else
            :src="`/optimized-images/img/${item.icon}-xl.webp`"
            alt="Hero Image"
          />
        </div>
        <div v-else>
          <!-- <i :class="item.icon"></i> -->
          <div class="icon-box" v-if="item.icon || hasSwitchEffect(item)">
            <!-- 修改：传入 active 属性 -->
            <IconSwitcher
              v-if="hasSwitchEffect(item)"
              :default-class="item.icon"
              :switch-classes="item.switchIcons"
              :active="hoveredCard === `${index}-${index}`"
            />

            <i v-else :class="item.icon"></i>
          </div>

          <div v-else>
            <img
              v-if="item.logo"
              :src="item.logo"
              :alt="item.title"
              class="card-icon"
            />
            <div v-else class="card-icon-placeholder">
              {{ item.title[0] }}
            </div>
          </div>
        </div>
        <div class="cat-info">
          <h3>{{ item.title }}</h3>
          <span>{{ item.badge }}</span>
        </div>
      </div>
      <p class="cat-desc">{{ item.desc }}</p>
      <div class="cat-tags">
        <span v-for="tag in item.tags" :key="tag" class="sub-tag">{{
          tag
        }}</span>
      </div>
    </a>
  </div>
</template>

<style scoped>
/* 复用之前的 CSS，并适配 VitePress 变量 */
.home-category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin: 40px 0;
}

.cat-card {
  background: var(--vp-c-bg-soft); /* 使用 VitePress 默认背景变量 */
  border-radius: 16px;
  padding: 24px;
  text-decoration: none !important; /* 覆盖 VP 默认样式 */
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
  border-color: transparent;
  background: var(--vp-c-bg);
}

.cat-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.icon-box {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 16px;
  transition: transform 0.3s;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
  overflow: hidden;
}

.cat-card:hover .icon-box {
  transform: rotate(-10deg) scale(1.1);
}

.cat-info h3 {
  font-size: 1.25rem;
  color: var(--vp-c-text-1);
  font-weight: 700;
  margin: 0 0 4px 0;
}
.cat-info span {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
.cat-desc {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
}

.cat-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}
.sub-tag {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}
.cat-card:hover .sub-tag {
  background: var(--vp-c-bg-soft);
}

.arrow-icon {
  position: absolute;
  top: 24px;
  right: 24px;
  color: var(--vp-c-divider);
  transition: 0.3s;
}
.cat-card:hover .arrow-icon {
  color: var(--vp-c-text-1);
  transform: translateX(4px);
}

/* 主题色适配 - 这里定义简单的颜色映射 */
/* .theme-blue .icon-box {
  color: #3b82f6;
  background: #eff6ff;
} */
.theme-blue:hover {
  border-top: 4px solid #3b82f6;
}

.icon-box {
  color: #8b5cf6;
  background: #ffffff;
}
.theme-purple:hover {
  border-top: 4px solid #8b5cf6;
}

/* .theme-orange .icon-box {
  color: #f59e0b;
  background: #fffbeb;
} */
.theme-orange:hover {
  border-top: 4px solid #f59e0b;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .home-category-grid {
    grid-template-columns: 1fr;
  }
}
</style>