import type { DefaultTheme } from 'vitepress'

/**
 * 侧栏由 config.ts 按目录自动生成（generateSidebar）。
 * 上游模板在这里写死了 /download/、/changelogs/、/pro-version/ 等 KeyTik 的页面，
 * 本站没有这些页面，链接全部 404，因此清空。
 */
const sidebar: DefaultTheme.SidebarMulti = {}

export default sidebar
