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
    link: '/docs/introduction/overview',
    activeMatch: '/docs/',
  },
]

export default nav
