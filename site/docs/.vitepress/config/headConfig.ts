import type { HeadConfig } from 'vitepress'

import { SITE_BASE } from './site'

/**
 * 说明（相对上游模板的改动）：
 * 1. 移除了上游模板自带的 Google Analytics(gtag) 与 iubenda GDPR 脚本——
 *    那些是第三方站点的账号 ID，保留会把本站访客数据发到别人的账户里。
 *    本站自己的 GA4 统计（G-7VB7F5RY4Z）改走站点根的 /ga.js，与 SPA、博客共用一份。
 * 2. 站点以 /docs/ 子路径部署，head 里的根绝对路径不会自动加 base，
 *    因此这里统一走 prefixBase()。
 */
function prefixBase(value: unknown): unknown {
  if (typeof value !== 'string')
    return value
  if (!value.startsWith('/') || value.startsWith('//'))
    return value
  return `${SITE_BASE.replace(/\/$/, '')}${value}`
}

const rawHead: HeadConfig[] = [
  ['meta', { name: 'darkreader-lock' }],
  ['meta', { name: 'theme-color', content: '#0058A0' }],
  ['meta', { name: 'msapplication-TileColor', content: '#0058A0' }],
  ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
  ['meta', { name: 'referrer', content: 'no-referrer-when-downgrade' }],
  ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
  ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
  ['link', { rel: 'manifest', href: '/site.webmanifest' }],
  ['link', { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#0058A0' }],
  ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
  ['meta', { name: 'twitter:card', content: 'summary' }],
  ['meta', { name: 'twitter:site', content: '@Humyang' }],
  ['meta', { name: 'twitter:creator', content: '@Humyang' }],
  ['meta', { property: 'og:site_name', content: 'agicodehub' }],
  ['meta', { property: 'og:description', content: 'Here, witness the first handshake between human intelligence and AGI.' }],
  ['meta', { property: 'og:locale', content: 'en_US' }],
  ['meta', { property: 'og:type', content: 'website' }],
]

const headConfig: HeadConfig[] = rawHead.map(([tag, attrs, children]) => {
  if (!attrs)
    return [tag, attrs, children]
  const next = Object.fromEntries(
    Object.entries(attrs).map(([k, v]) => [k, prefixBase(v)]),
  )
  return [tag, next, children]
})

// Google Analytics 4（G-7VB7F5RY4Z）。
// 引导脚本放在站点根的 /ga.js，和工具箱 SPA、博客共用一份；
// 它不在 /docs/ 下面，所以**不能**走上面的 prefixBase，否则会变成 /docs/ga.js 而 404。
headConfig.push(['script', { async: '', src: '/ga.js' }])

export default headConfig
