<script setup>
import { ref, computed } from "vue";
import { useData, withBase } from "vitepress";
import IconSwitcher from "./IconSwitcher.vue";

const { frontmatter } = useData();
const searchText = ref("");
// 新增：用于追踪当前悬停的是哪个卡片
const hoveredCard = ref(null);

const filteredGroups = computed(() => {
  const groups = frontmatter.value.navGroups || [];
  if (!searchText.value) return groups;
  const lowerText = searchText.value.toLowerCase();
  return groups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        return (
          item.title.toLowerCase().includes(lowerText) ||
          item.desc.toLowerCase().includes(lowerText)
        );
      });
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
});

const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 80;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = element.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  }
};

const navigateToStaticPage = (item) => {
  if (item.link) window.location.href = withBase(item.link);
};

const openInNewTab = (item, event) => {
  event.preventDefault();
  if (item.link) window.open(withBase(item.link), "_blank");
};

const handleClick = (item, event) => {
  if (item.openInNewTab) {
    openInNewTab(item, event);
  } else {
    navigateToStaticPage(item);
  }
};

const hasSwitchEffect = (item) => {
  return (
    item.switchIcons &&
    Array.isArray(item.switchIcons) &&
    item.switchIcons.length > 0
  );
};
</script>

<template>
  <div class="nav-page-container">
    <aside class="nav-sidebar">
      <div class="sidebar-title">Table of Contents</div>
      <ul class="nav-menu">
        <li
          v-for="group in frontmatter.navGroups"
          :key="group.id"
          class="nav-item"
        >
          <a @click.prevent="scrollToSection(group.id)" class="nav-link">
            <i :class="group.icon"></i> {{ group.title }}
          </a>
        </li>
      </ul>
    </aside>

    <main class="main-content">
      <div class="header-bar">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            v-model="searchText"
            placeholder="Search resources..."
          />
        </div>
      </div>

      <div v-if="filteredGroups.length === 0" class="no-result">
        No matching resources found
      </div>

      <section
        v-for="group in filteredGroups"
        :key="group.id"
        :id="group.id"
        class="nav-section"
      >
        <h2 v-if="group.link" class="section-title">
          <a :href="group.link" target="_blank"
            ><i :class="group.icon"></i> {{ group.title }}</a
          >
        </h2>
        <h2 v-else class="section-title">
          <i :class="group.icon"></i> {{ group.title }}
        </h2>

        <div class="site-grid">
          <!-- 
            修改：
            1. 生成唯一 key: `${group.id}-${idx}` 
            2. 添加 @mouseenter 和 @mouseleave 到 a.card 标签上
          -->
          <a
            v-for="(item, idx) in group.items"
            :key="idx"
            :href="item.link"
            class="card"
            :class="`theme-${item.theme || 'default'}`"
            @click="handleClick(item, $event)"
            @mouseenter="hoveredCard = `${group.id}-${idx}`"
            @mouseleave="hoveredCard = null"
            :target="item.openInNewTab ? '_blank' : '_self'"
          >
            <div class="card-header">
              <div class="icon-box" v-if="item.icon || hasSwitchEffect(item)">
                <!-- 修改：传入 active 属性 -->
                <IconSwitcher
                  v-if="hasSwitchEffect(item)"
                  :default-class="item.icon"
                  :switch-classes="item.switchIcons"
                  :active="hoveredCard === `${group.id}-${idx}`"
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

              <div class="card-info">
                <span class="card-title">{{ item.title }}</span>
                <p class="card-desc">{{ item.desc }}</p>
              </div>
            </div>
            <div class="card-footer">
              <span class="tag" v-if="item.tag">{{ item.tag }}</span>
              <span class="visit-btn"
                >Visit <i class="fa-solid fa-arrow-right"></i
              ></span>
            </div>
          </a>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* 样式部分不需要修改，保持原样 */
.nav-menu {
  list-style: none;
}
.nav-item {
  margin-bottom: 5px;
}
.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: var(--text-sub);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
}
.nav-page-container {
  display: flex;
  min-height: 80vh;
  position: relative;
}
.nav-sidebar {
  width: 200px;
  position: sticky;
  top: 80px;
  height: fit-content;
  padding-right: 20px;
  border-right: 1px solid var(--vp-c-divider);
  display: none;
}
@media (min-width: 960px) {
  .nav-sidebar {
    display: block;
  }
}
.sidebar-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--vp-c-text-1);
}
.nav-link {
  display: block;
  padding: 8px 10px;
  color: var(--vp-c-text-2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}
.nav-link:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand);
}
.nav-link i {
  width: 20px;
  text-align: center;
  margin-right: 5px;
}
.main-content {
  flex: 1;
  padding-left: 0;
}
@media (min-width: 960px) {
  .main-content {
    padding-left: 30px;
  }
}
.search-box {
  position: relative;
  margin-bottom: 30px;
  max-width: 400px;
}
.search-box input {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
}
.search-box i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--vp-c-text-3);
}
.section-title {
  font-size: 1.3rem;
  margin: 40px 0 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  gap: 10px;
}
.site-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
.card {
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid transparent;
  transition: all 0.3s;
  text-decoration: none !important;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.card:hover {
  transform: translateY(-3px);
  background: var(--vp-c-bg);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border-color: var(--vp-c-brand-dimm);
}
.card-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}
.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
  object-fit: cover;
  background: #fff;
}
.card-icon-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
  background: var(--vp-c-brand);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.card-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
  display: block;
}
.card-desc {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-footer {
  margin-top: auto;
  padding-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}
.tag {
  background: var(--vp-c-bg-alt);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--vp-c-text-3);
}
.visit-btn {
  color: var(--vp-c-brand);
  opacity: 0;
  transition: 0.2s;
}
.card:hover .visit-btn {
  opacity: 1;
}
.icon-box {
  background: white;
  min-height: 50px;
  min-width: 50px;
  border-radius: 10px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
</style>