import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

interface SidebarItem {
    text: string
    link?: string
    collapsed?: boolean
    items?: SidebarItem[]
}

interface GenerateSidebarOptions {
    exclude?: (string | RegExp)[]  // 要排除的文件或目录名
    includeIndex?: boolean         // 是否包含 index.md
    maxDepth?: number              // 最大递归深度
}

export function generateSidebar(
    dir: string,
    basePath: string = '',
    options: GenerateSidebarOptions = {}
): SidebarItem[] {
    const {
        exclude = [],
        includeIndex = false,
        maxDepth = 10
    } = options

    const items: SidebarItem[] = []
    const fullPath = join(process.cwd(), 'src', dir, basePath)

    // 检查递归深度
    const currentDepth = basePath.split('/').filter(Boolean).length
    if (currentDepth >= maxDepth) {
        return items
    }

    try {
        const entries = readdirSync(fullPath)

        for (const entry of entries) {
            const entryPath = join(fullPath, entry)
            const stat = statSync(entryPath)

            // 检查是否应该排除
            if (shouldExclude(entry, exclude)) continue

            if (stat.isDirectory()) {
                // 递归处理子目录
                const children = generateSidebar(dir, join(basePath, entry), options)
                if (children.length > 0) {
                    items.push({
                        text: formatTitle(entry),
                        collapsed: true,
                        items: children
                    })
                }
            } else if (entry.endsWith('.md')) {
                // 处理 Markdown 文件
                if (!includeIndex && entry === 'index.md') continue

                items.push({
                    text: formatTitle(entry.replace('.md', '')),
                    link: `/${dir}/${basePath ? basePath + '/' : ''}${entry.replace('.md', '')}`
                })
            }
        }
    } catch (error) {
        console.warn(`无法读取目录: ${fullPath}`)
    }

    return items.sort((a, b) => a.text.localeCompare(b.text))
}

// 检查是否应该排除该文件/目录
function shouldExclude(name: string, exclude: (string | RegExp)[]): boolean {
    if (name.startsWith('.') || name === 'node_modules') return true

    return exclude.some(pattern => {
        if (typeof pattern === 'string') {
            return name === pattern
        } else if (pattern instanceof RegExp) {
            return pattern.test(name)
        }
        return false
    })
}

function formatTitle(filename: string): string {
    return filename
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}