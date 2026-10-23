---
layout: home
hero:
  name: AGI Code Hub 博客
  text: 工具、脚本与效率方法
  tagline: 把每天踩过的坑写下来，省得再踩一次。
  actions:
    - theme: brand
      text: 读最新的
      link: /posts/welcome
    - theme: alt
      text: 回到工具箱
      link: https://agicodehub.com/
---

<script setup>
import { data as posts } from './posts.data'
</script>

<div class="post-list">
  <article v-for="post in posts" :key="post.url" class="post-item">
    <h2><a :href="post.url">{{ post.title }}</a></h2>
    <p class="post-meta">
      <time :datetime="post.date">{{ new Date(post.date).toLocaleDateString('zh-CN') }}</time>
      <span v-if="post.tags.length"> · {{ post.tags.join(' / ') }}</span>
    </p>
    <p>{{ post.description }}</p>
  </article>
  <p v-if="!posts.length" class="post-empty">还没有文章。</p>
</div>

<style>
.post-list { max-width: 720px; margin: 0 auto; padding: 24px 24px 96px; }
.post-item { padding: 20px 0; border-bottom: 1px solid var(--vp-c-divider); }
.post-item h2 { margin: 0 0 6px; font-size: 20px; line-height: 1.4; }
.post-item h2 a { color: var(--vp-c-text-1); text-decoration: none; }
.post-item h2 a:hover { color: var(--vp-c-brand-1); }
.post-meta { margin: 0 0 8px; font-size: 13px; color: var(--vp-c-text-3); }
.post-empty { color: var(--vp-c-text-3); }
</style>
