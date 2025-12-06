import type { DefaultTheme } from 'vitepress'

const sidebar: DefaultTheme.SidebarMulti = {
  '/download/': defaultSidebar(),
  '/docs/': defaultSidebar(),
  '/changelogs/': defaultSidebar(),
  '/pro-version/': defaultSidebar(),
  '/sandbox/': defaultSidebar(),
}

function defaultSidebar(): DefaultTheme.SidebarItem[] {
  return [
    // {
    //   items: [
    //     {
    //       text: 'Download',
    //       link: '/download/',
    //     },
    //     {
    //       text: 'Changelogs',
    //       link: '/changelogs/',
    //     },
    //     {
    //       text: 'Pro Version',
    //       link: '/pro-version/',
    //     },
    //   ],
    // },
    // {
    //   text: 'Introduction',
    //   items: [
    //     {
    //       text: 'Overview',
    //       link: '/docs/introduction/overview',
    //     },
    //     {
    //       text: 'Safety',
    //       link: '/docs/introduction/safety',
    //     },
    //     {
    //       text: 'Features',
    //       link: '/docs/introduction/features',
    //     },
    //     {
    //       text: 'Use Case Example',
    //       link: '/docs/introduction/use-case',
    //     },
    //   ],
    // },
    // {
    //   text: 'Getting Started',
    //   items: [
    //     {
    //       text: 'List of Supported Keys',
    //       collapsed: true,
    //       items: [
    //         { text: 'Keyboard', link: '/docs/getting-started/key-list/keyboard' },
    //         { text: 'Mouse', link: '/docs/getting-started/key-list/mouse' },
    //         { text: 'Virtual Keyboard Code', link: '/docs/getting-started/key-list/vk-code' },
    //         { text: 'Scan Code', link: '/docs/getting-started/key-list/scan-code' },
    //         { text: 'ASCII', link: '/docs/getting-started/key-list/ascii' },
    //         { text: 'ANSI', link: '/docs/getting-started/key-list/ansi' },
    //         { text: 'Unicode', link: '/docs/getting-started/key-list/unicode' },
    //       ],
    //     },
    //     {
    //       text: 'Automation Tool',
    //       link: '/docs/getting-started/automation-tool',
    //     },
    //     {
    //       text: 'agicodehub Mechanism',
    //       link: '/docs/getting-started/mechanism',
    //     },
    //     {
    //       text: 'Community',
    //       link: '/docs/getting-started/community',
    //     },
    //   ],
    // },
    {
      text: 'AI',
      items: [
        {
          text: 'Audio',
          collapsed: true,
          items: [
            { text: 'IndexTTS2 开源语音模型部署教程', link: '/docs/ai/audio/indextts2.md' },
          ],
        },
      ],
    },
    {
      text: 'Logs',
      items: [
        {
          text: 'Develop Log',
          link: '/docs/logs/develop-log.md',
        },
        {
          text: 'Promotion Log',
          link: '/docs/logs/promotion-log.md',
        },
      ],
    },
  ]
}

export default sidebar
