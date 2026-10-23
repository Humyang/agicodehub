import { withBase } from 'vitepress'

/**
 * 站内链接解析。
 *
 * 文档站以子路径（默认 /docs/）部署，绝大多数内部链接要跟随 VitePress base；
 * 但有两类必须原样返回：
 *   1. `/static/...` —— 静态工具页，由站点根的 SPA（public/static）提供，
 *      加 base 会变成 /docs/static/... 而 404；
 *   2. 外部 URL 与锚点 —— 与 base 无关。
 */
export function resolveHref(link?: string | null): string {
  if (!link)
    return ''
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(link))
    return link
  if (link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('#'))
    return link
  if (link === '/static' || link.startsWith('/static/'))
    return link

  return withBase(link)
}
