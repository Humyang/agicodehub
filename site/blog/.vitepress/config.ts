import { defineConfig } from 'vitepress'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Feed } from 'feed'
import { createContentLoader } from 'vitepress'

/**
 * 博客实例。
 *
 * 与文档站（site/docs，base=/docs/）是两个独立的 VitePress 实例，
 * 各自有 .vitepress 与产物目录，构建互不影响；最终都写进站点根的 dist/，
 * 由同一个 Cloudflare Pages 项目对外提供服务。
 */

const SITE_BASE = '/blog/'
const SITE_ORIGIN = process.env.VITE_HOSTNAME || 'https://agicodehub.com'
const SITE_PREFIX = `${SITE_ORIGIN.replace(/\/$/, '')}${SITE_BASE}`

export default defineConfig({
  base: SITE_BASE,
  outDir: '../../dist/blog',
  cleanUrls: true,
  lang: 'zh-CN',
  title: 'AGI Code Hub 博客',
  description: 'AGI Code Hub 的实践记录：工具、脚本与效率方法。',
  lastUpdated: true,
  sitemap: { hostname: SITE_PREFIX },

  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'theme-color', content: '#0058A0' }],
    ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'RSS', href: `${SITE_BASE}feed.xml` }],
    // Google Analytics 4（G-7VB7F5RY4Z）：引导脚本在站点根，三站共用一份
    ['script', { async: '', src: '/ga.js' }],
  ],

  themeConfig: {
    nav: [
      { text: '博客', link: '/' },
      { text: '文档', link: `${SITE_ORIGIN}/docs/` },
      { text: '工具箱', link: `${SITE_ORIGIN}/` },
    ],
    sidebar: false,
    outline: [2, 3],
    footer: {
      message: '内容以实践为主，不保证长期有效。',
      copyright: `Copyright © ${new Date().getFullYear()} Humyang`,
    },
  },

  // 生成 RSS。放在 buildEnd 里做，读取的是已经过滤/排序好的文章列表。
  buildEnd: async (siteConfig) => {
    const posts = await createContentLoader('posts/*.md', {
      excerpt: true,
      render: true,
      transform(raw) {
        return raw
          .filter(p => p.frontmatter.date && p.frontmatter.draft !== true)
          .sort((a, b) => +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date))
      },
    }).load()

    const feed = new Feed({
      title: 'AGI Code Hub 博客',
      description: 'AGI Code Hub 的实践记录：工具、脚本与效率方法。',
      id: SITE_PREFIX,
      link: SITE_PREFIX,
      language: 'zh-CN',
      copyright: `Copyright © ${new Date().getFullYear()} Humyang`,
      updated: posts.length ? new Date(posts[0].frontmatter.date) : new Date(),
    })

    for (const post of posts) {
      const url = `${SITE_PREFIX}${post.url.replace(/^\//, '')}`
      feed.addItem({
        title: post.frontmatter.title,
        id: url,
        link: url,
        description: post.frontmatter.description || '',
        content: post.html || '',
        date: new Date(post.frontmatter.date),
      })
    }

    await writeFile(join(siteConfig.outDir, 'feed.xml'), feed.rss2(), 'utf-8')
  },
})
