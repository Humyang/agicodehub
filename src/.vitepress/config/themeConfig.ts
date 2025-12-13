import type { DefaultTheme } from 'vitepress'

import nav from './navigation/navbar'
import sidebar from './navigation/sidebar'

const themeConfig: DefaultTheme.Config = {
  logo: {
    // src: '/img/logo-128px.png',
    // src: '/img/light.png',
    // src: {
    //   light: '/img/light.png',
    //   dark: '/img/dark.png'
    // },
    light: '/optimized-images/img/light-xs.webp',
    dark: '/optimized-images/img/dark-xs.webp',
    width: 24,
    height: 24,
  },
  // 语言切换器
  i18nRouting: true,
  nav,
  sidebar,

  outline: [2, 3],

  socialLinks: [
    // {
    //   icon: 'github',
    //   link: 'https://github.com/Humyang/agicodehub',
    //   ariaLabel: 'Project GitHub',
    // },
    {
      icon: 'x',
      link: 'https://x.com/NicoYangxg',
      ariaLabel: 'X Page',
    },
    // { icon: "instagram", link: "https://instagram.com/Humyang", ariaLabel: "Instagram Page" },
  ],
  // <span class="divider">|</span> <a href="/policies/user-agreement/">User Agreement</a>

  footer: {
    message: `
      
      <span class="divider"></span> <a href="/policies/privacy-policies/">Privacy policy</a>
      <span class="divider">|</span> <a href="/policies/about-me/">About Me</a>
      <span class="divider">|</span> <a href="/policies/contact/">Contact</a>
      
      <div>Create From <a href="https://vitepress.dev">Vitepress</a>,theme by <a href="https://github.com/Humyang/agicodehub">AgiCodeHub</a> </div>
    `,
    copyright: `Copyright © ${new Date().getFullYear()} Humyang`,
  },

  // editLink: {
  //   pattern: 'https://github.com/Humyang/website-dev/edit/main/website/src/:path',
  //   text: 'Help us improve this page',
  // },

  lastUpdated: {
    text: 'Last updated',
    formatOptions: {
      forceLocale: true,
      dateStyle: 'long',
      timeStyle: 'short',
    },
  },

  // search: {
  //   provider: 'algolia',
  //   options: {
  //     appId: 'XQZMAE09U8',
  //     apiKey: '2cef38c0bbfea7164213239191be5310',
  //     indexName: 'agicodehub Website',
  //   },
  // },
}

export default themeConfig
