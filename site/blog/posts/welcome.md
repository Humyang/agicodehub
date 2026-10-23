---
title: 博客已就位
date: 2026-10-23
description: /blog/ 从今天起有了自己的位置——VitePress 静态博客，和工具箱、文档站共用同一个域名。
tags: [站点建设]
---

# 博客已就位

这是 `/blog/` 的第一篇。

过去几天这个路径返回的一直是工具箱的首页——因为整个站点只有一个 Vue 应用，`public/_redirects` 里的 `/* → /index.html 200` 把所有没命中的路径都兜到了 SPA。`/blog/` 也不例外。

现在结构调整成了三层：

| 路径 | 内容 | 技术 |
|---|---|---|
| `/` | 工具箱（88 个原生工具 + 静态工具页） | Vue 3 + Vite SPA |
| `/docs/` | 文档与产品导航 | VitePress（子路径 base `/docs/`） |
| `/blog/` | 就是这里 | VitePress（子路径 base `/blog/`） |

三者是独立的构建产物，最后都写进同一个 `dist/`，由同一个 Cloudflare Pages 项目对外服务。谁更新都不影响谁。

## 后面要做的

- 把 `dve2.com` 时期 WordPress 上的文章迁过来（几百篇，带图）
- 旧链接 301 到新地址，别让外部链接失效
- 评论接 Giscus

慢慢来。
