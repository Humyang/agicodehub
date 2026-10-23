import { createContentLoader } from 'vitepress'

export interface Post {
  url: string
  title: string
  date: string
  description: string
  tags: string[]
  readingMinutes: number
}

declare const data: Post[]
export { data }

export default createContentLoader('posts/*.md', {
  transform(raw) {
    return raw
      .filter(p => p.frontmatter.date && p.frontmatter.draft !== true)
      .map(({ url, frontmatter, content }) => ({
        url,
        title: frontmatter.title ?? url.replace('/posts/', '').replace('.html', ''),
        date: new Date(frontmatter.date).toISOString(),
        description: frontmatter.description ?? '',
        tags: frontmatter.tags ?? [],
        // 中文按 400 字/分钟估算，够用即可
        readingMinutes: Math.max(1, Math.round((content?.split(/\s+/).length ?? 0) / 400)),
      }))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
  },
})
