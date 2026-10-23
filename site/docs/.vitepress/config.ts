import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vitepress'
import ElementPlus from 'unplugin-element-plus/vite'
import fs from 'node:fs'
import path from 'node:path'
import markdownConfig from './config/markdownConfig'
import { SITE_BASE, SITE_ORIGIN, SITE_PREFIX } from './config/site'

// For use with loading Markdown plugins
import themeConfig from './config/themeConfig'

// Theme related config
import headConfig from './config/headConfig'

// Provides how to generate Meta head tags

import generateMeta from './config/hooks/generateMeta'

// Allows generation of RSS feed

const title = 'AGI Code Hub'
const description = 'AGI Code Hub — 在线开发者工具箱与文档：FFmpeg 脚本生成器、代码工具、图标资源。'

const env = loadEnv('', process.cwd())
const hostname: string = SITE_ORIGIN
import { generateSidebar } from './utils/generateSidebar'

const locales = {
  zh: {
    label: '简体中文',
    lang: 'zh-CN',
    link: '/zh/',
    themeConfig: {
      // siteTitle: false, // 隐藏默认文字，只显示你的插槽内容
      nav: [
        { text: '首页', link: '/zh/' },
        // { text: '指南', link: '/zh/guide/' }
        {
          text: 'Blog',
          link: 'https://www.agicodehub.com/blog/',
        },
        {
          text: 'Docs',
          link: '/docs/',
          activeMatch: '/docs/',
        },
      ],
      sidebar: {
        '/zh/': generateSidebar('zh', '', {
          exclude: ['temp', 'drafts', /^\./, 'archive'], // 排除 temp、drafts 目录，以点开头的文件，archive 目录
          includeIndex: false, // 不包含 index.md
          maxDepth: 5 // 最大递归深度为 5
        })
      }
    }
  },

  root: {
    label: 'English',
    lang: 'en',
    link: '/',
    // root
    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Github', link: 'https://github.com/Humyang/agicodehub' },
        // { text: 'Guide', link: '/guide/' }
        {
          text: 'Blog',
          link: 'https://www.agicodehub.com/blog/',
        },
        {
          text: 'Docs',
          link: '/docs/',
          activeMatch: '/docs/',
        },
      ],
    }
  }
}


export default defineConfig({
  base: SITE_BASE,
  outDir: '../../dist/docs',
  lastUpdated: true,
  cleanUrls: true,
  title,
  description,
  locales,
  sitemap: {
    // 必须带尾斜杠：sitemap 用 new URL(path, hostname) 解析，
    // 少了斜杠 '/docs' 会被当成文件名，base 就被吃掉了。
    hostname: SITE_PREFIX,
  },

  head: headConfig,
  markdown: markdownConfig,
  themeConfig,
  transformHead: async context => generateMeta(context, hostname),

  vite: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && /\.(png|jpe?g|svg|gif|webp)$/.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    resolve: {
      alias: [
        {
          // Used to show the release version on navbar.
          find: /^.*\/VPNavBarMenu\.vue$/,
          replacement: fileURLToPath(
            new URL('./theme/components/CustomNavBarMenu.vue', import.meta.url),
          ),
        },
        {
          find: /^.*VPNavScreenMenu\.vue$/,
          replacement: fileURLToPath(
            new URL('./theme/components/CustomNavScreenMenu.vue', import.meta.url),
          ),
        },
        {
          find: /^.*VPSwitchAppearance\.vue$/,
          replacement: fileURLToPath(
            new URL('./theme/components/CustomSwitchAppearance.vue', import.meta.url),
          ),
        },

      ],
    },
    plugins: [ElementPlus({}), {
      name: 'serve-static-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // 检查是否是404请求
          if (req.url && !req.url.startsWith('/@') && !req.url.includes('.')) {
            // 首先尝试在 public/static 目录中查找
            let staticPath = `public/static${req.url}`

            // 检查是否是目录，如果是则尝试加载 index.html
            if (fs.existsSync(path.join(process.cwd(), staticPath))) {
              const stats = fs.statSync(path.join(process.cwd(), staticPath))
              if (stats.isDirectory()) {
                staticPath = path.join(staticPath, 'index.html')
              }
            }

            // 检查静态文件是否存在
            if (fs.existsSync(path.join(process.cwd(), staticPath))) {
              const fileContent = fs.readFileSync(path.join(process.cwd(), staticPath))
              const ext = path.extname(staticPath).toLowerCase()

              // 设置相应的Content-Type
              const mimeTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml'
              }

              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
              res.end(fileContent)
              return
            }

            // 如果没有找到静态文件，检查是否是 VitePress 路由
            const vitePressRoutes = ['/docs/', '/zh/docs/'] // 添加您的路由前缀
            const isVitePressRoute = vitePressRoutes.some(route => req.url?.startsWith(route))

            if (!isVitePressRoute) {
              // 对于非 VitePress 路由，尝试返回默认的静态文件
              const defaultStaticPath = 'public/static/index.html'
              if (fs.existsSync(path.join(process.cwd(), defaultStaticPath))) {
                const fileContent = fs.readFileSync(path.join(process.cwd(), defaultStaticPath))
                res.setHeader('Content-Type', 'text/html')
                res.end(fileContent)
                return
              }
            }
          }
          next()
        })
      }
    }],
    ssr: {
      noExternal: ['element-plus'],
    },
    // optimizeDeps: {
    //   include: ['tailwindcss']
    // }
  },
})
