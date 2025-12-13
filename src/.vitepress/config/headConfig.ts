import type { HeadConfig } from 'vitepress'
const isProduction = process.env.NODE_ENV === 'production'

// Google Analytics ID
const GA_ID = 'G-7VB7F5RY4Z'


// 生产环境的统计脚本
const analyticsScripts = isProduction ? [
  // Google Analytics gtag.js
  [
    'script',
    {
      async: true,
      src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    }
  ],
  [
    'script',
    {},
    `window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');`
  ],
] : []
const gdpr = isProduction ? [[
  'script',
  {},
  `var _iub = _iub || [];
    _iub.csConfiguration = {"siteId":4345460,"cookiePolicyId":26087680,"lang":"en","storage":{"useSiteId":true}};`
],
['script', { type: 'text/javascript', src: 'https://cs.iubenda.com/autoblocking/4345460.js' }],
['script', { type: 'text/javascript', src: '//cdn.iubenda.com/cs/gpp/stub.js' }],
['script', {
  type: 'text/javascript',
  src: '//cdn.iubenda.com/cs/iubenda_cs.js',
  charset: 'UTF-8',
  async: true
}]] : []
const headConfig = [
  ...analyticsScripts,
  ...gdpr,
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

export default headConfig
