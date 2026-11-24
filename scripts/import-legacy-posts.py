#!/usr/bin/env python3
"""
从 Wayback Machine 恢复 dve2.com（WordPress）时期的文章，转成 VitePress 的 markdown。

背景：
    dve2.com 现在整站已经是另一个产品，旧文章在线上不存在；新站 /blog/ 当时只迁了
    一篇 welcome。旧站能救回来的内容只剩 Wayback 的 14 篇快照（12 英文 + 2 中文），
    其余（如 /archives/13/、/archives/175/）没有任何存档，属于真丢失。

用法：
    python3 scripts/import-legacy-posts.py                 # 抓存档并写入 site/blog/posts/
    python3 scripts/import-legacy-posts.py --from-dir /tmp/dve2-archive   # 用已下载的 HTML
    python3 scripts/import-legacy-posts.py --out /tmp/preview             # 只输出到暂存目录
    python3 scripts/import-legacy-posts.py --print-redirects              # 只打印 _redirects 片段

依赖：pip3 install markdownify beautifulsoup4
"""
from __future__ import annotations

import argparse
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup
from markdownify import markdownify

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / 'site' / 'blog' / 'posts'

# (旧文章 ID, 旧路径, 语言, 新 slug, tags)
# slug 保持与旧 WordPress 一致（英文），中文文章手工取短 slug
ARTICLES = [
    (299, '/archives/299/create-gifs-from-video-clips-with-ffmpeg-ultimate-guide/', 'en',
     'create-gifs-from-video-clips-with-ffmpeg-ultimate-guide', ['FFmpeg']),
    (303, '/archives/303/online-ffmpeg-transform-your-media-processing-workflow-in-2024/', 'en',
     'online-ffmpeg-vs-local-ffmpeg', ['FFmpeg']),
    (305, '/archives/305/ffmpeg-online-web-based-tools-and-script-generators-for-media-processing/', 'en',
     'ffmpeg-online-web-based-tools-and-script-generators', ['FFmpeg']),
    (307, '/archives/307/ffmpeg-crop-gif-a-step-by-step-guide-to-perfectly-trim-your-animations/', 'en',
     'ffmpeg-crop-gif-step-by-step-guide', ['FFmpeg']),
    (309, '/archives/309/mp4-to-gif-ffmpeg-complete-conversion-guide-with-pro-tips/', 'en',
     'mp4-to-gif-ffmpeg-complete-conversion-guide', ['FFmpeg']),
    (311, '/archives/311/optimize-gif-size-with-ffmpeg-reduce-file-sizes-in-3-steps/', 'en',
     'optimize-gif-size-with-ffmpeg', ['FFmpeg']),
    (313, '/archives/313/ffmpeg-online-service-best-tools-for-video-audio-processing-in-2024/', 'en',
     'ffmpeg-online-service-best-tools-for-video-audio-processing', ['FFmpeg']),
    (315, '/archives/315/ffmpeg-mp4-to-gif-convert-videos-to-animated-images-easily/', 'en',
     'ffmpeg-mp4-to-gif-convert-videos-to-animated-images', ['FFmpeg']),
    (317, '/archives/317/convert-video-to-gif-command-line-master-ffmpeg-for-efficient-conversions/', 'en',
     'convert-video-to-gif-command-line', ['FFmpeg']),
    (319, '/archives/319/create-gifs-from-video-clips-with-ffmpeg-ultimate-conversion-guide-2/', 'en',
     'create-gifs-from-video-clips-with-ffmpeg-ultimate-conversion-guide-2', ['FFmpeg']),
    (321, '/archives/321/ffmpeg-gif-ultimate-guide-to-creating-and-optimizing-gifs-with-ffmpeg/', 'en',
     'ffmpeg-gif-ultimate-guide', ['FFmpeg']),
    (33, '/archives/33/how-to-crop-and-convert-gifs-using-ffmpeg-a-step-by-step-guide-for-content-creators/', 'en',
     'how-to-crop-and-convert-gifs-using-ffmpeg', ['FFmpeg']),
    (195, '/zh/archives/195/使用ffmpeg高效处理大批量视频/', 'zh',
     'zh-ffmpeg-batch-video-processing', ['FFmpeg']),
    (205, '/zh/archives/205/酷冷至尊机械键盘键位重置win-键失效-ubuntu下-super键无效/', 'zh',
     'zh-coolermaster-key-reset-super-key', ['硬件']),
]

# 正文里要整块丢掉的 WordPress 噪声
DROP_CLASSES = (
    'sharedaddy', 'jp-relatedposts', 'post-navigation', 'comments-area',
    'wp-block-buttons', 'wp-block-latest-posts', 'wp-block-image', 'ad-slot',
)


def fetch(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers={'Accept-Encoding': 'identity'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def latest_snapshot(url_path: str) -> tuple[str, bytes] | None:
    q = (
        'http://web.archive.org/cdx/search/cdx?url=www.dve2.com'
        f'{urllib.parse.quote(url_path)}&output=json&fl=timestamp,statuscode'
        '&filter=statuscode:200&limit=-3'
    )
    try:
        rows = json.loads(fetch(q, timeout=60) or b'[]')
    except Exception as exc:  # noqa: BLE001
        print(f'  CDX 查询失败：{exc}')
        return None
    if len(rows) < 2:
        return None
    ts = rows[-1][0]
    raw = f'http://web.archive.org/web/{ts}id_/https://www.dve2.com{urllib.parse.quote(url_path)}'
    try:
        return ts, fetch(raw)
    except Exception as exc:  # noqa: BLE001
        print(f'  抓取失败：{exc}')
        return None


def normalize_code(body, soup: BeautifulSoup) -> None:
    """WordPress 里命令行常写成 <p><code>…</code></p>，直接转 markdown 会变成
    行内反引号、并且 <br> 断行导致命令被拆散。这里统一改成 <pre><code>。"""
    for br in body.find_all('br'):
        br.replace_with('\n')

    for p in list(body.find_all('p')):
        kids = [c for c in p.children if getattr(c, 'name', None)]
        text_outside = ''.join(str(c) for c in p.children if not getattr(c, 'name', None)).strip()
        if len(kids) == 1 and kids[0].name == 'code' and not text_outside:
            pre = soup.new_tag('pre')
            code = soup.new_tag('code')
            code.string = kids[0].get_text()
            pre.append(code)
            p.replace_with(pre)

    # 一个 <pre> 里塞了多个 <code>（每个一行）的，合并成一段
    for pre in body.find_all('pre'):
        codes = pre.find_all('code')
        if len(codes) > 1:
            pre.clear()
            merged = soup.new_tag('code')
            merged.string = '\n'.join(c.get_text() for c in codes)
            pre.append(merged)


def clean_body(soup: BeautifulSoup):
    body = soup.select_one('div.entry-content') or soup.find('article') or soup.find('main')
    if body is None:
        return None
    for tag in body.find_all(['script', 'style', 'noscript', 'form', 'iframe']):
        tag.decompose()
    for tag in body.find_all(True):
        if tag is None or tag.attrs is None:
            continue
        classes = ' '.join(tag.get('class') or [])
        if any(bad in classes for bad in DROP_CLASSES):
            tag.decompose()

    # 有些文章正文开头又写了一遍标题（如 205），去掉它避免重复。
    # 注意不能无脑删第一个 h1：309 正文里的 h1 是 mac/Linux 安装命令。
    first_h1 = body.find('h1')
    if first_h1 is not None:
        h1_text = first_h1.get_text(' ', strip=True).lower()
        # 标题在调用 clean_body 之后才知道，这里先用整页 h1 文本粗判：
        # 正文 h1 与页面主标题相同或高度相似 → 认为是重复标题
        page_h1 = [t.get_text(' ', strip=True).lower() for t in soup.find_all('h1')]
        looks_like_title = h1_text in page_h1[:1] and not h1_text.startswith('#')
        if looks_like_title and len(first_h1.get_text(strip=True)) > 20:
            first_h1.decompose()

    # 旧站编辑得比较随意，把 shell 命令行也写成了 <h1>（例如 309 里的
    # macOS / Linux 安装命令）。这类一律还原成代码块，其余降级为 h3。
    for h1 in body.find_all('h1'):
        text = h1.get_text(' ', strip=True)
        if text.startswith('#') or ' install ' in f' {text} ' or 'apt-get' in text or 'brew' in text:
            pre = soup.new_tag('pre')
            code = soup.new_tag('code')
            code.string = text
            pre.append(code)
            h1.replace_with(pre)
        else:
            h1.name = 'h3'

    normalize_code(body, soup)
    return body


def to_markdown(body, site_host: str) -> str:
    md = markdownify(str(body), heading_style='ATX', bullets='-', escape_asterisks=False)

    # 指向旧站的链接会 404：只留文字，去掉链接（保留外链）
    def unlink(match: re.Match) -> str:
        text, url = match.group(1), match.group(2)
        if url.startswith(('http://', 'https://')):
            if site_host in url or 'dve2.com' in url:
                return text
            return match.group(0)
        return text

    md = re.sub(r'\[([^\]]+)\]\(([^)\s]+)[^)]*\)', unlink, md)
    md = re.sub(r'!\[\]\([^)]*\)', '', md)          # 空图片
    md = re.sub(r'```\n\n```\n', '', md)            # 相邻代码块合并成一块
    md = re.sub(r'\n{3,}', '\n\n', md)              # 压缩空行
    md = re.sub(r'[ \t]+\n', '\n', md)
    return md.strip()


def build_post(aid: int, path: str, lang: str, slug: str, tags: list[str], html: str) -> tuple[str, dict]:
    soup = BeautifulSoup(html, 'html.parser')

    h1 = soup.find('h1')
    title = h1.get_text(strip=True) if h1 else (soup.title.get_text(strip=True) if soup.title else slug)

    time_tag = soup.find('time')
    date = (time_tag.get('datetime') or '')[:10] if time_tag else ''

    desc_tag = soup.find('meta', attrs={'name': 'description'})
    description = (desc_tag.get('content') or '').strip() if desc_tag else ''
    # WordPress 的 meta description 有时直接复制了标题，去掉重复前缀
    if description.startswith(title):
        description = description[len(title):].lstrip(' ：:，,-—')
    if len(description) > 120:
        description = description[:117].rstrip() + '…'

    body = clean_body(soup)
    if body is None:
        raise SystemExit(f'#{aid} 正文容器没找到')

    content = to_markdown(body, 'dve2.com')
    if len(content) < 200:
        raise SystemExit(f'#{aid} 正文过短（{len(content)} 字），疑似解析失败')

    front = [
        '---',
        f'title: {json.dumps(title, ensure_ascii=False)}',
        f'date: {date}',
        f'description: {json.dumps(description, ensure_ascii=False)}',
        f'tags: [{", ".join(tags)}]',
        f'legacy_id: {aid}',
        f'legacy_url: {json.dumps("https://www.dve2.com" + path, ensure_ascii=False)}',
        'restored_from: wayback',
        '---',
        '',
        f'# {title}',
        '',
        content,
        '',
    ]
    return '\n'.join(front), {'id': aid, 'slug': slug, 'title': title, 'date': date, 'lang': lang, 'path': path}


def redirect_lines(meta: dict) -> list[str]:
    """旧地址 → 新文章。中文路径要按 URL 编码写，请求到达时是编码后的形式。"""
    slug = meta['slug']
    target = f'/blog/posts/{slug}'
    encoded = urllib.parse.quote(meta['path'])
    lines = []
    if meta['lang'] == 'zh':
        lines.append(f'{encoded:<62} {target:<24} 301')
        lines.append(f'/dve2{encoded:<56} {target:<24} 301')
    else:
        lines.append(f'{meta["path"]:<62} {target:<24} 301')
        lines.append(f'/dve2{meta["path"]:<56} {target:<24} 301')
    return lines


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--from-dir', type=Path, help='已下载的存档 HTML 目录（文件名 <id>.html）')
    ap.add_argument('--out', type=Path, help='输出目录，默认 site/blog/posts')
    ap.add_argument('--print-redirects', action='store_true', help='只打印 _redirects 片段')
    args = ap.parse_args()

    out_dir = args.out or POSTS_DIR
    metas: list[dict] = []
    failures = []

    for aid, path, lang, slug, tags in ARTICLES:
        html: str | None = None
        if args.from_dir:
            f = args.from_dir / f'{aid}.html'
            if f.exists():
                html = f.read_text(encoding='utf-8', errors='ignore')
        if html is None:
            got = latest_snapshot(path)
            if got is None:
                failures.append(aid)
                continue
            html = got[1].decode('utf-8', 'ignore')

        try:
            text, meta = build_post(aid, path, lang, slug, tags, html)
        except SystemExit as exc:
            print(f'✗ {exc}')
            failures.append(aid)
            continue

        if not args.print_redirects:
            out_dir.mkdir(parents=True, exist_ok=True)
            (out_dir / f'{slug}.md').write_text(text, encoding='utf-8')
        metas.append(meta)
        print(f'✓ #{aid} → {slug}.md  ({meta["date"]}, {len(text)} 字符)')

    if args.print_redirects:
        print('\n# 下面这段贴进 public/_redirects 第 1 节（必须在 /dve2/archives/* 通配之前）')
        for meta in metas:
            for line in redirect_lines(meta):
                print(line)

    print(f'\n完成 {len(metas)} 篇，失败 {len(failures)} 篇 {failures if failures else ""}')


if __name__ == '__main__':
    main()
