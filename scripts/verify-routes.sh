#!/usr/bin/env bash
# 部署后自检：确认三层路由在 Cloudflare Pages 上真的按预期工作
#
# 用法：
#   ./scripts/verify-routes.sh                          # 检查生产域名
#   ./scripts/verify-routes.sh https://xxx.pages.dev    # 检查某次部署快照
#
# 为什么需要这个脚本：
#   /docs/ 与 /blog/ 能否正确返回，取决于 Pages「静态资源优先于 _redirects」
#   这条平台行为。本脚本把该假设变成可执行的断言——一旦平台行为变化，
#   这里会立刻红掉，而不是等搜索引擎收录一堆软 404。
set -uo pipefail

BASE="${1:-https://agicodehub.com}"
PASS=0
FAIL=0

check() {
  local path="$1" expect_status="$2" expect_title="$3"
  local body status title

  body="$(curl -sS --max-time 20 -o /tmp/.verify-body -w '%{http_code}' "${BASE}${path}" 2>/dev/null)"
  status="$body"
  title="$(grep -o '<title>[^<]*' /tmp/.verify-body 2>/dev/null | head -1 | sed 's/<title>//')"

  local ok=1
  [ "$status" = "$expect_status" ] || ok=0
  if [ -n "$expect_title" ]; then
    case "$title" in
      *"$expect_title"*) ;;
      *) ok=0 ;;
    esac
  fi

  if [ "$ok" = "1" ]; then
    PASS=$((PASS + 1))
    printf '  ✓ %-42s %s  %s\n' "$path" "$status" "${title:0:44}"
  else
    FAIL=$((FAIL + 1))
    printf '  ✗ %-42s %s (期望 %s)  %s\n' "$path" "$status" "$expect_status" "${title:0:44}"
  fi
}

echo "目标：$BASE"
echo

echo "── 1. 工具箱 SPA（站点根）─────────────────────────────────────"
check "/"                          200 "免费在线开发者工具箱"
check "/service"                   200 ""
check "/text-diff"                 200 ""

echo
echo "── 2. 文档站 /docs/（必须是 VitePress，不能是 SPA 壳）──────────"
check "/docs/"                     200 "AGI Code Hub"
check "/docs/ffmpegtool/"          200 "FFmpeg"
check "/docs/codetool/"            200 "代码工具"
check "/docs/ui/"                  200 "UI"
check "/docs/zh/"                  200 "AGI Code Hub"
check "/docs/policies/privacy-policies" 200 "Privacy"

echo
echo "── 3. 博客 /blog/ ────────────────────────────────────────────"
check "/blog/"                     200 "博客"
check "/blog/posts/welcome"        200 "博客已就位"
check "/blog/feed.xml"             200 ""

echo
echo "── 4. 静态工具页（跳过 base，必须在站点根）──────────────────────"
check "/static/ffmpegtool/video-split/index.html" 200 ""
check "/docs/optimized-images/img/light-xs.webp"  200 ""

echo
echo "── 5. 子站 404 兜底（不能返回 200 的 SPA 壳）───────────────────"
check "/docs/this-page-does-not-exist" 404 ""
check "/blog/this-post-does-not-exist" 404 ""

echo
echo "── 6. 旧站 301 ───────────────────────────────────────────────"
for path in /archives /zh/ /tools/nav.html; do
  code="$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' "${BASE}${path}" 2>/dev/null)"
  loc="$(curl -sSI --max-time 20 "${BASE}${path}" 2>/dev/null | tr -d '\r' | awk 'tolower($1)=="location:"{print $2}')"
  if [ "$code" = "301" ] || [ "$code" = "308" ]; then
    PASS=$((PASS + 1))
    printf '  ✓ %-42s %s → %s\n' "$path" "$code" "$loc"
  else
    FAIL=$((FAIL + 1))
    printf '  ✗ %-42s %s (期望 301) → %s\n' "$path" "$code" "$loc"
  fi
done

echo
echo "── 汇总：通过 ${PASS}，失败 ${FAIL} ──"
if [ "$FAIL" -gt 0 ]; then
  cat <<'EOT'

排查顺序：
  1. 若第 2 组全部是 SPA 壳（标题为「免费在线开发者工具箱」）：
     说明静态资源没有优先于 _redirects，或 dist/docs 没部署上去。
     先确认 dist/docs/index.html 存在，再看 Pages 部署日志。
  2. 若第 5 组返回 200：
     public/_redirects 里 /docs/* 与 /blog/* 的两条 404 规则没生效，
     位置被 /index.html 200 兜底抢先了 → 检查规则顺序。
  3. 若第 2 组返回 404：
     Pages 的 pretty URL 没把 /docs/xxx 映射到 /docs/xxx.html。
     退路是把 public/_redirects 里的两条 404 规则换成 functions/_middleware.ts
     显式分流（见交接文档第 4.3 节的兜底预案）。
EOT
  exit 1
fi
