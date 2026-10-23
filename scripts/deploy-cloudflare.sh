#!/usr/bin/env bash
# 一键发布 AGI Code Hub 到 Cloudflare Pages（项目名默认 agicodehub）
#
# 用法：
#   ./scripts/deploy-cloudflare.sh                 # 需要时自动走设备码登录，然后发布
#   CF_PAGES_PROJECT=xxx ./scripts/deploy-cloudflare.sh
#   CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=yyy ./scripts/deploy-cloudflare.sh  # CI 方式，免登录
#
# 环境变量：
#   CF_PAGES_PROJECT     Pages 项目名，默认 agicodehub
#   CF_BRANCH            分支名，默认 main（对应项目生产分支）
#   SKIP_BUILD=1         跳过构建，直接发布现有 dist
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT="${CF_PAGES_PROJECT:-agicodehub}"
BRANCH="${CF_BRANCH:-main}"

# 1. 定位 wrangler：优先全局命令，退回本机 npx 缓存
if command -v wrangler >/dev/null 2>&1; then
  RUN=(wrangler)
else
  CACHED="$(ls -d "$HOME"/.npm/_npx/*/node_modules/wrangler/bin/wrangler.js 2>/dev/null | head -1 || true)"
  if [ -n "$CACHED" ]; then
    RUN=(node "$CACHED")
  else
    echo "未找到 wrangler，请先安装：npm i -g wrangler" >&2
    exit 1
  fi
fi

# 2. 构建（除非显式跳过）
#
# 三段构建，顺序不能变：
#   a) vite build 会清空 dist/，必须第一个跑
#   b) 文档站与博客是 VitePress 的两个独立实例，各自写入 dist/docs、dist/blog
# 三者互不覆盖，最终由一次 wrangler 部署整体发布。
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "==> 1/3 构建工具箱 SPA"
  NODE_OPTIONS=--max_old_space_size=4096 ./node_modules/.bin/vite build

  if [ -d site/node_modules ]; then
    SITE_RUN=(pnpm --dir site)
  elif command -v pnpm >/dev/null 2>&1; then
    echo "site/node_modules 不存在，先安装站点依赖"
    pnpm --dir site install
    SITE_RUN=(pnpm --dir site)
  else
    echo "未找到 pnpm，文档站与博客无法构建" >&2
    exit 1
  fi

  export VITE_HOSTNAME="${VITE_HOSTNAME:-https://agicodehub.com}"

  echo "==> 2/3 构建文档站 /docs/"
  "${SITE_RUN[@]}" run build:docs

  echo "==> 3/3 构建博客 /blog/"
  "${SITE_RUN[@]}" run build:blog
fi

# 三份产物都必须存在，缺一个就说明哪段构建断了
for f in dist/index.html dist/docs/index.html dist/blog/index.html; do
  [ -f "$f" ] || { echo "构建产物缺失：$f" >&2; exit 1; }
done

# 3. 授权：有 API Token 直接走；否则用设备码登录（无需 localhost 回调，代理环境下更可靠）
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "==> 使用 CLOUDFLARE_API_TOKEN 授权"
else
  if ! "${RUN[@]}" whoami 2>&1 | grep -qi "You are logged in"; then
    echo "==> 未登录，启动设备码授权"
    "${RUN[@]}" login --device
  fi
fi

# 4. 发布到 Cloudflare Pages 生产环境
echo "==> 发布 dist → Pages 项目 ${PROJECT}（分支 ${BRANCH}）"
"${RUN[@]}" pages deploy dist \
  --project-name "$PROJECT" \
  --branch "$BRANCH" \
  --commit-dirty=true

echo "==> 完成：https://${PROJECT}.pages.dev"
