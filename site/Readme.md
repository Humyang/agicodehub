# site/ — 文档站与博客

VitePress 双实例。两个实例互相独立，各自构建、各自带 base，最后都写进站点根的 `dist/`，
与工具箱 SPA 一起由**同一个 Cloudflare Pages 项目**发布。

```
site/
├── docs/                    → dist/docs/    base = /docs/
│   ├── .vitepress/
│   │   ├── config.ts
│   │   ├── config/site.ts   ← SITE_BASE / SITE_ORIGIN / SITE_PREFIX
│   │   ├── theme/           ← 自定义主题（导航卡片、深浅色、Tailwind）
│   │   └── utils/
│   ├── index.md             门面首页
│   ├── ffmpegtool/ codetool/ ui/    产品导航页
│   ├── policies/            法务页
│   ├── zh/                  中文镜像
│   └── public/              图片、logo、favicon
└── blog/                    → dist/blog/    base = /blog/
    ├── .vitepress/config.ts
    ├── posts/               文章（markdown）
    ├── posts.data.ts        列表数据加载器
    └── index.md             文章列表
```

## 开发

```bash
cd site
pnpm install            # 首次
pnpm run dev:docs       # http://127.0.0.1:5173  （base 会被自动带上，实际是 /docs/）
pnpm run dev:blog       # 博客
```

## 构建

由根目录 `scripts/deploy-cloudflare.sh` 统一驱动，顺序不能变：

```bash
./scripts/deploy-cloudflare.sh          # 1/3 SPA → 2/3 docs → 3/3 blog → 部署
```

单独构建某一个：

```bash
pnpm run build:docs     # → ../dist/docs
pnpm run build:blog     # → ../dist/blog
```

`vite build` 会清空 `dist/`，所以单独重跑 `build:docs` 之前**不要**再跑 SPA 构建，
否则三份产物会被清掉。

## 与站点根的分工

| 路径 | 归属 | 说明 |
| --- | --- | --- |
| `/`、`/service`、`/text-diff` 等 | 工具箱 SPA | 88 个工具 + 落地页 |
| `/static/**` | 工具箱 SPA 的 `public/static` | 静态工具页；文档站里的链接**不加** `/docs` 前缀 |
| `/docs/**` | `site/docs` | |
| `/blog/**` | `site/blog` | |

`/static/**` 的链接不能经过 VitePress 的 `withBase`，否则会变成 `/docs/static/**` 而 404。
因此导航组件统一走 `docs/.vitepress/theme/utils/href.ts` 的 `resolveHref()`。

## 本地预览整站

`python3 -m http.server` 只看文件，不认 `_redirects`，也不做 pretty URL，
`/docs/ffmpegtool/` 这种路径会直接 404，测不出真实效果。

用 `scripts/serve-local.py`——它复刻了 Cloudflare Pages 的判定顺序
（静态文件 → `.html` → `/index.html` → `_redirects` → 就近 404.html）：

```bash
cd ..
python3 scripts/serve-local.py            # http://127.0.0.1:5180
python3 scripts/serve-local.py --port 8080
```

然后：

```bash
./scripts/verify-routes.sh http://127.0.0.1:5180    # 三层路由自检，19 项
```

## 许可证

`site/` 派生自 KeyTik 官网（MPL-2.0）。见仓库根 `THIRD_PARTY_NOTICES.md`。
