/**
 * 站点级常量。
 *
 * 文档站以子路径部署（agicodehub.com/docs/），博客另有一个实例（agicodehub.com/blog/）。
 * 站点根由 Vue SPA（工具箱）占用，三者共用一个 Cloudflare Pages 项目。
 */
export const SITE_BASE = '/docs/'

/** 生产域名；本地构建可用 VITE_HOSTNAME 覆盖，用于生成 canonical / og:url / sitemap */
export const SITE_ORIGIN = process.env.VITE_HOSTNAME || 'https://agicodehub.com'

/** 带 base 的绝对站点前缀，供 canonical 等场景拼接 */
export const SITE_PREFIX = `${SITE_ORIGIN.replace(/\/$/, '')}${SITE_BASE}`
