<template>
  <div class="home-layout">
    <div class="navigation-grid">
      <div
        v-for="(category, index) in navigationCategories"
        :key="index"
        class="category-section"
      >
        <div class="category-header">
          <div class="category-title">{{ category.title }}</div>
          <a
            v-if="category.moreLink"
            :href="category.moreLink.url"
            class="more-button"
            :class="{ 'external-link': category.moreLink.external }"
          >
            {{ category.moreLink.text }}
          </a>
        </div>
        <div class="links-grid">
          <a
            v-for="link in category.links"
            :key="link.url"
            :href="link.url"
            class="nav-link"
            :class="{
              'external-link': link.external,
              'force-refresh': link.forceRefresh,
            }"
            :target="link.newWindow ? '_blank' : null"
            :rel="link.newWindow ? 'noopener noreferrer' : null"
            @click.native="handleLinkClick(link, $event)"
          >
            <span class="link-icon" v-if="link.icon">📎</span>
            <span class="link-text">{{ link.text }}</span>
            <span class="link-description" v-if="link.description">{{
              link.description
            }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useData } from "vitepress";

const { site, frontmatter } = useData();

// 导航分类配置 - 您可以根据需要修改这些数据
const navigationCategories = frontmatter.value.navigationCategories || [];
// 处理链接点击事件
const handleLinkClick = (link: any, event: Event) => {
  // 如果链接需要强制刷新
  if (link.forceRefresh) {
    event.preventDefault();
    window.location.href = link.url;
  }
};
// const navigationCategories = [
//   {
//     title: "FFmpeg工具集合",
//     moreLink: {
//       text: "查看更多",
//       url: "/ffmpegtool/",
//       description: "探索更多FFmpeg工具",
//     },
//     links: [
//       {
//         text: "视频裁剪/分割/格式转换",
//         url: "/ffmpegtool/video-split/",
//         description: "快速生成ffmpeg裁剪、分割、格式转换视频的代码",
//       },
//       {
//         text: "slideshow",
//         url: "/ffmpegtool/slideshow",
//         description: "快速生成ffmpeg图片过渡视频代码",
//       },
//       {
//         text: "image crop",
//         url: "/api/",
//         description: "快速生成ffmpeg批量裁剪目录图片代码",
//       },
//     ],
//   },
//   {
//     title: "开发资源导航",
//     links: [
//       { text: "功能特性", url: "/features/", description: "主要功能特性" },
//       { text: "配置说明", url: "/configuration/", description: "详细配置选项" },
//       {
//         text: "最佳实践",
//         url: "/best-practices/",
//         description: "使用最佳实践",
//       },
//     ],
//   },
//   {
//     title: "在线工具集合",
//     links: [
//       {
//         text: "GitHub仓库",
//         url: "https://github.com/Humyang/agicodehub",
//         description: "源代码和问题追踪",
//         external: true,
//       },
//       { text: "更新日志", url: "/changelog/", description: "版本更新记录" },
//       { text: "贡献指南", url: "/contributing/", description: "参与项目开发" },
//     ],
//   },
//   {
//     title: "社区支持",
//     links: [
//       { text: "常见问题", url: "/faq/", description: "常见问题解答" },
//       {
//         text: "问题反馈",
//         url: "https://github.com/Humyang/agicodehub/issues",
//         description: "报告问题和建议",
//         external: true,
//       },
//       {
//         text: "联系我们",
//         url: "/policies/contact/",
//         description: "获取技术支持",
//       },
//     ],
//   },
// ];
</script>

<style scoped>
.home-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100vw;
}
.navigation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  justify-items: center;
}

.category-section {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-border);
  width: 100%;
  max-width: 400px;
  min-width: 0;
  box-sizing: border-box;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #42d392 25%, #647eff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-description {
  font-size: 1.2rem;
  color: var(--vp-c-text-2);
  max-width: 600px;
  margin: 0 auto;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--vp-c-brand);
  padding-bottom: 0.5rem;
}

.category-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
}

.more-button {
  padding: 0.5rem 1rem;
  background: linear-gradient(
    135deg,
    var(--vp-c-brand),
    var(--vp-c-brand-dark)
  );
  /* color: white; */
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
}

.more-button:hover {
  background: linear-gradient(
    135deg,
    var(--vp-c-brand-dark),
    var(--vp-c-brand-darker)
  );
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--vp-c-brand), 0.3);
  /* color: white; */
}
/* .category-section {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-border);
  width: 370px;
} */
/* 
.category-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--vp-c-text-1);
  border-bottom: 2px solid var(--vp-c-brand);
  padding-bottom: 0.5rem;
} */

.links-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nav-link {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: all 0.2s ease;
  position: relative;
}

.nav-link:hover {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.link-icon {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.link-text {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.link-description {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.4;
}

.external-link::after {
  content: "↗";
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-3);
}

@media (max-width: 768px) {
  .home-layout {
    padding: 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .navigation-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .category-section {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .home-layout {
    padding: 0.5rem;
  }

  .navigation-grid {
    gap: 0.75rem;
  }

  .category-section {
    padding: 0.75rem;
  }

  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (min-width: 1200px) {
  .navigation-grid {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  }
}

@media (min-width: 1400px) {
  .navigation-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}
</style>