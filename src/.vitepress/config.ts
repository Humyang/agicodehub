import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vitepress'
import ElementPlus from 'unplugin-element-plus/vite'
import fs from 'node:fs'
import path from 'node:path'
import markdownConfig from './config/markdownConfig'

// For use with loading Markdown plugins
import themeConfig from './config/themeConfig'

// Theme related config
import headConfig from './config/headConfig'

// Provides how to generate Meta head tags

import generateMeta from './config/hooks/generateMeta'

// Allows generation of RSS feed
import generateOgImages from './config/hooks/generateOgImages'

const title = 'agicodehub'
const description = 'agicodehub'

const env = loadEnv('', process.cwd())
const hostname: string = env.VITE_HOSTNAME || 'http://localhost:4173'
import { generateSidebar } from './utils/generateSidebar'

const locales = {
  zh: {
    label: '简体中文',
    lang: 'zh-CN',
    link: '/zh/',
    themeConfig: {
      nav: [
        { text: '首页', link: '/zh/' },
        // { text: '指南', link: '/zh/guide/' }
        {
          text: 'Blog',
          link: 'https://www.agicodehub.com/blog/',
        },
        {
          text: 'Docs',
          link: '/zh/docs/',
          activeMatch: '/docs/',
        },
      ],
      sidebar: {
        '/zh/docs/': generateSidebar('zh/docs', '', {
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
        // { text: 'Guide', link: '/guide/' }
        {
          text: 'Blog',
          link: 'https://www.agicodehub.com/blog/',
        },
        // {
        //   text: 'Docs',
        //   link: '/docs/',
        //   activeMatch: '/docs/',
        // },
      ],
      sidebar: {
        '/docs/': [
          // {
          //   text: 'AI',
          //   items: [
          //     {
          //       text: 'Audio',
          //       collapsed: true,
          //       items: [
          //         { text: 'IndexTTS2 开源语音模型部署教程', link: '/docs/ai/audio/indextts2.md' },
          //       ],
          //     },
          //   ],
          // },
          // {
          //   text: 'Logs',
          //   items: [
          //     {
          //       text: 'Develop Log',
          //       link: '/docs/logs/develop-log.md',
          //     },
          //     {
          //       text: 'Promotion Log',
          //       link: '/docs/logs/promotion-log.md',
          //     },
          //   ],
          // },
        ]
      }
    }
  }
}


export default defineConfig({
  outDir: '../dist',
  lastUpdated: true,
  cleanUrls: true,
  title,
  description,
  locales,
  sitemap: {
    hostname,
  },
  head: headConfig,
  markdown: markdownConfig,
  themeConfig,
  transformHead: async context => generateMeta(context, hostname),
  buildEnd: async (context) => {
    generateOgImages(context)
  },

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
