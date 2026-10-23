import type { DefaultTheme } from 'vitepress'

const nav: DefaultTheme.NavItem[] = [
  // {
  //   text: 'Language',
  //   activeMatch: '^/*?(download|changelogs)/*?$',
  //   items: [
  //     {
  //       text: 'English',
  //       link: '/',
  //     },
  //     {
  //       text: '中文',
  //       link: '/zh/',
  //     },
  //   ],
  // },
  // {
  //   text: 'agicodehub Pro',
  //   link: '/pro-version/',
  // },
  {
    text: 'Blog',
    link: 'https://www.agicodehub.com/blog/',
  },
  {
    text: 'Docs',
    // 相对站点根：VitePress 会自动加上 base（/docs/），写成 /docs/ 会变成 /docs/docs/
    link: '/',
    activeMatch: '/',
  },
]

export default nav
