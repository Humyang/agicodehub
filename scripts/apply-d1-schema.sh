#!/usr/bin/env bash
# 应用 D1 表结构（db/schema.sql）。
#
# 用法：
#   ./scripts/apply-d1-schema.sh            # 应用到线上 D1
#   ./scripts/apply-d1-schema.sh --local    # 应用到本地 D1（调试用）
#
# 环境变量：
#   D1_DB_NAME   数据库名，默认 agicodehub-leads
#
# 说明：脚本会自己 cd 到仓库根目录，所以在任何目录下执行都不会因为
# 相对路径找不到 db/schema.sql 而报错。

set -euo pipefail

# 无论从哪里调用，都切到仓库根目录
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

DB="${D1_DB_NAME:-agicodehub-leads}"
MODE="--remote"
if [ "${1:-}" = "--local" ]; then
  MODE="--local"
fi

SCHEMA="$ROOT/db/schema.sql"
if [ ! -f "$SCHEMA" ]; then
  echo "✘ 找不到表结构文件：$SCHEMA" >&2
  exit 1
fi

# 定位 wrangler：优先全局命令，退回 npx 缓存（与 deploy-cloudflare.sh 同策略）
if command -v wrangler >/dev/null 2>&1; then
  RUN=(wrangler)
else
  CACHED="$(ls -d "$HOME"/.npm/_npx/*/node_modules/wrangler/bin/wrangler.js 2>/dev/null | head -1 || true)"
  if [ -n "$CACHED" ]; then
    RUN=(node "$CACHED")
  else
    echo "✘ 未找到 wrangler，请先安装：npm i -g wrangler" >&2
    exit 1
  fi
fi

if [ "$MODE" = "--local" ] && [ ! -f "$ROOT/wrangler.toml" ]; then
  echo "提示：--local 需要 wrangler.toml 里的 d1_databases 绑定来确定本地库。" >&2
  echo "      想本地调试请先：cp wrangler.toml.example wrangler.toml 并填入 database_id" >&2
  echo "" >&2
fi

echo "==> 数据库：$DB"
echo "==> 表结构：$SCHEMA"
echo "==> 目标：$([ "$MODE" = "--local" ] && echo '本地' || echo '线上（Cloudflare）')"
echo ""

"${RUN[@]}" d1 execute "$DB" "$MODE" --file="$SCHEMA"

echo ""
echo "==> 完成。验证一下表是否建好："
if [ "$MODE" = "--local" ]; then
  echo "    ${RUN[*]} d1 execute $DB --local --command \"SELECT name FROM sqlite_master WHERE type='table'\""
else
  echo "    ${RUN[*]} d1 execute $DB --remote --command \"SELECT name FROM sqlite_master WHERE type='table'\""
fi
