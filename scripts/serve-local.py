#!/usr/bin/env python3
"""
本地预览 dist/，行为对齐 Cloudflare Pages 的路由规则。

python3 -m http.server 不够用——它既不懂 _redirects，也不做 pretty URL，
/docs/ffmpegtool/ 这种路径会直接 404，测不出真实效果。

本服务器按 Pages 的判定顺序实现：

    1. 精确命中静态文件
    2. 命中 <path>.html          （pretty URL）
    3. 命中 <path>/index.html    （目录）
    4. 应用 public/_redirects     （顺序即优先级，首条命中即止）
    5. 就近的 404.html

用法：
    python3 scripts/serve-local.py                # 默认 127.0.0.1:5180
    python3 scripts/serve-local.py --port 8080
    python3 scripts/serve-local.py --dir dist
"""
from __future__ import annotations

import argparse
import mimetypes
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('application/rss+xml', '.xml')


class Rule:
    __slots__ = ('pattern', 'target', 'status', 'exact')

    def __init__(self, pattern: str, target: str, status: int) -> None:
        self.pattern = pattern
        self.target = target
        self.status = status
        self.exact = '*' not in pattern

    def match(self, path: str) -> bool:
        if self.exact:
            return path == self.pattern
        prefix = self.pattern.split('*')[0]
        return path.startswith(prefix)

    def __repr__(self) -> str:  # pragma: no cover
        return f'<{self.pattern} → {self.target} {self.status}>'


def load_rules(dist: Path) -> list[Rule]:
    f = dist / '_redirects'
    if not f.exists():
        return []
    rules: list[Rule] = []
    for raw in f.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split()
        if len(parts) < 2:
            continue
        pattern, target = parts[0], parts[1]
        status = 302
        if len(parts) >= 3 and parts[2].isdigit():
            status = int(parts[2])
        rules.append(Rule(pattern, target, status))
    return rules


def resolve_asset(dist: Path, path: str) -> Path | None:
    """按 Pages 的顺序找一个真实文件。"""
    rel = path.lstrip('/')
    if not rel:
        cand = dist / 'index.html'
        return cand if cand.is_file() else None

    candidates = [
        dist / rel,
        dist / f'{rel}.html',
        dist / rel / 'index.html',
    ]
    for cand in candidates:
        try:
            cand.resolve().relative_to(dist.resolve())
        except ValueError:
            return None          # 防路径穿越
        if cand.is_file():
            return cand
    return None


def nearest_404(dist: Path, path: str) -> Path | None:
    """Pages 会返回请求路径所在目录（逐级向上）的 404.html。"""
    parts = [p for p in path.split('/') if p]
    if parts and '.' in parts[-1]:
        parts = parts[:-1]
    while True:
        cand = dist.joinpath(*parts) / '404.html'
        if cand.is_file():
            return cand
        if not parts:
            return None
        parts.pop()


class Handler(BaseHTTPRequestHandler):
    dist: Path
    rules: list[Rule]
    quiet: bool = False

    server_version = 'pages-local'

    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        if not self.quiet:
            sys.stderr.write('  %s %s\n' % (self.command, self.path))

    # ---------------------------------------------------------------- core
    def do_GET(self) -> None:      # noqa: N802
        self._handle(send_body=True)

    def do_HEAD(self) -> None:     # noqa: N802
        self._handle(send_body=False)

    def _handle(self, send_body: bool) -> None:
        path = self.path.split('?', 1)[0].split('#', 1)[0]

        asset = resolve_asset(self.dist, path)
        if asset is not None:
            self._send_file(asset, 200, send_body)
            return

        # 目录缺尾斜杠 → 308，和 Pages 一致
        if not path.endswith('/') and (self.dist / path.lstrip('/')).is_dir():
            self._redirect(path + '/', 308)
            return

        for rule in self.rules:
            if not rule.match(path):
                continue
            if rule.status in (301, 302, 303, 307, 308):
                self._redirect(rule.target, rule.status)
                return
            target = resolve_asset(self.dist, rule.target)
            if target is not None:
                self._send_file(target, rule.status if rule.status >= 400 else 200, send_body)
                return
            break

        fallback = nearest_404(self.dist, path)
        if fallback is not None:
            self._send_file(fallback, 404, send_body)
        else:
            self._send_bytes(b'404 not found\n', 404, 'text/plain; charset=utf-8', send_body)

    # ------------------------------------------------------------- helpers
    def _redirect(self, location: str, status: int) -> None:
        self.send_response(status)
        self.send_header('Location', location)
        self.send_header('Content-Length', '0')
        self.end_headers()

    def _send_file(self, path: Path, status: int, send_body: bool) -> None:
        ctype, _ = mimetypes.guess_type(str(path))
        ctype = ctype or 'application/octet-stream'
        if path.suffix in ('.html', '.xml', '.txt'):
            ctype += '; charset=utf-8'
        self._send_bytes(path.read_bytes(), status, ctype, send_body, extra=self._cache_header(path))

    def _cache_header(self, path: Path) -> tuple[str, str] | None:
        rel = '/' + str(path.relative_to(self.dist))
        if '/assets/' in rel:
            return ('Cache-Control', 'public, max-age=31536000, immutable')
        if rel.startswith('/docs/') or rel.startswith('/blog/'):
            return ('Cache-Control', 'no-store')
        return None

    def _send_bytes(
        self,
        body: bytes,
        status: int,
        ctype: str,
        send_body: bool,
        extra: tuple[str, str] | None = None,
    ) -> None:
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        if extra:
            self.send_header(*extra)
        self.end_headers()
        if send_body:
            self.wfile.write(body)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=5180)
    ap.add_argument('--bind', default='127.0.0.1')
    ap.add_argument('--dir', default=str(ROOT / 'dist'))
    ap.add_argument('--quiet', action='store_true')
    args = ap.parse_args()

    dist = Path(args.dir).resolve()
    if not (dist / 'index.html').exists():
        print(f'找不到 {dist}/index.html，先构建：./scripts/deploy-cloudflare.sh', file=sys.stderr)
        return 1

    Handler.dist = dist
    Handler.rules = load_rules(dist)
    Handler.quiet = args.quiet

    httpd = ThreadingHTTPServer((args.bind, args.port), Handler)
    print(f'预览 {dist}')
    print(f'  http://{args.bind}:{args.port}/        工具箱')
    print(f'  http://{args.bind}:{args.port}/docs/   文档站')
    print(f'  http://{args.bind}:{args.port}/blog/   博客')
    print(f'  已加载 {len(Handler.rules)} 条 _redirects 规则')
    print('  Ctrl+C 停止')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n已停止')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
