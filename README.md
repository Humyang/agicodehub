# AGI Code Hub

免费开源的在线开发者工具箱：88 个常用工具 + FFmpeg 工具集 + 文档站 + 博客，全部计算在浏览器本地完成。

- 站点：<https://www.agicodehub.com>
- 仓库：<https://github.com/Humyang/agicodehub>
- 上游：派生自 [IT-Tools](https://github.com/CorentinTh/it-tools)（GPL-3.0），见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)

## 目录结构

```
.
├── src/                 工具箱 SPA（Vue 3 + Vite + Naive UI）
├── public/static/       静态工具页（不参与 SPA 构建，按站点根路径直出）
├── site/docs/           文档站（VitePress 实例 1，base=/docs/）
├── site/blog/           博客（VitePress 实例 2，base=/blog/）
├── functions/api/       Cloudflare Pages Function：/api/lead（D1 线索库）
├── db/schema.sql        D1 表结构
└── scripts/             构建、部署、本地预览、路由自检
```

三层产物统一由同一个 Cloudflare Pages 项目发布：`dist/`（SPA）+ `dist/docs/` + `dist/blog/`。

## 本地开发

```bash
pnpm install

pnpm dev                 # 工具箱 SPA，http://localhost:5173
```

文档站与博客是独立实例：

```bash
cd site
pnpm install             # 首次
pnpm run dev:docs        # 文档站
pnpm run dev:blog        # 博客
```

## 本地预览整站（复刻 Pages 路由）

`python3 -m http.server` 不认 `_redirects`、不做 pretty URL，`/docs/ffmpegtool/` 会 404。
用 `scripts/serve-local.py`，它按 Pages 的判定顺序（静态文件 → `.html` → `/index.html` → `_redirects` → 就近 404）走：

```bash
python3 scripts/serve-local.py              # http://127.0.0.1:5180
./scripts/verify-routes.sh http://127.0.0.1:5180   # 三层路由自检，19 项
```

## 构建与部署

```bash
./scripts/deploy-cloudflare.sh    # 1/3 SPA → 2/3 docs → 3/3 blog → 部署
```

`vite build` 会清空 `dist/`，所以顺序不能改；单独重跑 `build:docs` 前不要再跑 SPA 构建。

D1 绑定与线索接口说明见 [docs/leads-setup.md](./docs/leads-setup.md)。

## 其它命令

```bash
pnpm build               # 类型检查 + 生产构建
pnpm test                # 单元测试（Vitest）
pnpm lint                # ESLint
pnpm run script:create:tool my-tool-name   # 新增一个工具脚手架
```

## 许可证

GNU GPLv3，见 [LICENSE](./LICENSE)。上游 IT-Tools 版权归 Corentin Thomasset 所有；
`site/` 目录派生自 KeyTik 官网（MPL-2.0）。
