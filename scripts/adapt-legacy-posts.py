#!/usr/bin/env python3
"""
把从 Wayback 恢复的 dve2 旧文适配到 agicodehub 现在的站点结构。

恢复脚本（import-legacy-posts.py）只负责把正文搬过来，内容和链接还带着旧站痕迹：
  1. 文中反复出现的 FFmpeg.DVE2.com 是旧站的脚本生成器，域名如今已不再服务该产品
  2. 旧 WordPress 正文用 ### 作为一级小节，落到 VitePress 里层级断档
  3. 命令行被写成行内反引号（`ffmpeg -i ...`），单独成段时应是代码块
  4. meta description 是从旧站截断来的，结尾带省略号
  5. 没有标明"本文已迁移"，读者不知道 2024/2025 的内容出处

本脚本做确定性替换，可重复执行（幂等）。人工判断的部分（description 文案）写在
DESCRIPTIONS 里，避免每次重新生成时口径飘。

用法：
    python3 scripts/adapt-legacy-posts.py            # 直接改写 site/blog/posts
    python3 scripts/adapt-legacy-posts.py --check    # 只报告将要改动的地方
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS = ROOT / 'site' / 'blog' / 'posts'

SITE = 'https://agicodehub.com'
WORKBENCH = f'{SITE}/ffmpeg-workbench'
RUNNER = f'{SITE}/ffmpeg-script-tool'

# 旧站脚本生成器的各种写法 → 新站工具
BRAND_PATTERNS = [
    (re.compile(r'\bFFmpeg\.DVE2\.com\b'), f'[FFmpeg Command Workbench]({WORKBENCH})'),
    (re.compile(r'\bFFmpeg\.dve2\.com\b'), f'[FFmpeg Command Workbench]({WORKBENCH})'),
    (re.compile(r'\bFFmpeg\.DVE2\b'), f'[FFmpeg Command Workbench]({WORKBENCH})'),
    (re.compile(r'https?://ffmpeg\.dve2\.com/?'), WORKBENCH),
    (re.compile(r'\bFFmpeg Script Tool\b'), 'FFmpeg Command Workbench'),
    # 裸域名（不带 scheme）的兜底，放在最后，避免重复替换
    (re.compile(r'\bffmpeg\.dve2\.com\b', re.I), f'[FFmpeg Command Workbench]({WORKBENCH})'),
]

# 手写 description：旧站的 meta 是截断的，这里按文章实际内容重写
DESCRIPTIONS = {
    'create-gifs-from-video-clips-with-ffmpeg-ultimate-guide':
        'Turn video clips into clean GIFs with FFmpeg: trim the duration, resize, tune frame rate and palette, with commands you can copy.',
    'online-ffmpeg-transform-your-media-processing-workflow-in-2024':
        'What browser-based FFmpeg tools and script generators actually change in a media workflow — and where the command line still wins.',
    'ffmpeg-online-web-based-tools-and-script-generators':
        'A tour of web-based FFmpeg tools and script generators: what they do well, where they fall short, and how to choose one.',
    'ffmpeg-crop-gif-step-by-step-guide':
        'Crop GIFs precisely with the FFmpeg crop filter: keep the aspect ratio right and avoid the usual pitfalls of editing animations.',
    'mp4-to-gif-ffmpeg-complete-conversion-guide':
        'Complete MP4 to GIF guide: two-pass palette conversion, quality tuning, size control, and the commands that actually work.',
    'optimize-gif-size-with-ffmpeg':
        'Shrink GIFs with FFmpeg in three steps — palette optimization, frame rate and scaling, and removing redundant frames.',
    'ffmpeg-online-service-best-tools-for-video-audio-processing':
        'The main FFmpeg online services for video and audio processing: capabilities, limits, and which one fits your workflow.',
    'ffmpeg-mp4-to-gif-convert-videos-to-animated-images':
        'Convert MP4 to GIF without muddy colors or oversized files: palette generation, dithering options, and size control.',
    'convert-video-to-gif-command-line':
        'Master video-to-GIF conversion on the command line: the flags that matter, batch scripting, and how to keep output small.',
    'create-gifs-from-video-clips-with-ffmpeg-ultimate-conversion-guide-2':
        'Create GIFs from video clips end to end — trimming, scaling, palette optimization, and a repeatable command recipe.',
    'ffmpeg-gif-ultimate-guide':
        'Everything about FFmpeg and GIFs: creating, optimizing, fixing color banding and choppy playback, and automating the commands.',
    'how-to-crop-and-convert-gifs-using-ffmpeg':
        'Step by step: crop and convert GIFs with FFmpeg, with the exact commands for cropping animations and exporting small files.',
    'zh-ffmpeg-batch-video-processing':
        '用 FFmpeg 批量处理大量视频：循环脚本、并行转码与常用参数，附可直接复用的命令。',
    'zh-coolermaster-key-reset-super-key':
        '酷冷至尊 XT V2 机械键盘键位错乱的恢复方法：Win 键失效、Ubuntu 下 Super 键无效时的快捷键重置与出厂恢复。',
}

# 每篇文章的相关文章（按 tag 里的 FFmpeg 主题手工挑选，避免随机推荐）
RELATED = {
    'create-gifs-from-video-clips-with-ffmpeg-ultimate-guide': ['mp4-to-gif-ffmpeg-complete-conversion-guide', 'optimize-gif-size-with-ffmpeg'],
    'create-gifs-from-video-clips-with-ffmpeg-ultimate-conversion-guide-2': ['create-gifs-from-video-clips-with-ffmpeg-ultimate-guide', 'ffmpeg-gif-ultimate-guide'],
    'mp4-to-gif-ffmpeg-complete-conversion-guide': ['optimize-gif-size-with-ffmpeg', 'ffmpeg-mp4-to-gif-convert-videos-to-animated-images'],
    'ffmpeg-mp4-to-gif-convert-videos-to-animated-images': ['mp4-to-gif-ffmpeg-complete-conversion-guide', 'convert-video-to-gif-command-line'],
    'convert-video-to-gif-command-line': ['ffmpeg-gif-ultimate-guide', 'mp4-to-gif-ffmpeg-complete-conversion-guide'],
    'ffmpeg-gif-ultimate-guide': ['optimize-gif-size-with-ffmpeg', 'ffmpeg-crop-gif-step-by-step-guide'],
    'optimize-gif-size-with-ffmpeg': ['ffmpeg-gif-ultimate-guide', 'create-gifs-from-video-clips-with-ffmpeg-ultimate-guide'],
    'ffmpeg-crop-gif-step-by-step-guide': ['how-to-crop-and-convert-gifs-using-ffmpeg', 'ffmpeg-gif-ultimate-guide'],
    'how-to-crop-and-convert-gifs-using-ffmpeg': ['ffmpeg-crop-gif-step-by-step-guide', 'create-gifs-from-video-clips-with-ffmpeg-ultimate-guide'],
    'ffmpeg-online-web-based-tools-and-script-generators': ['ffmpeg-online-service-best-tools-for-video-audio-processing', 'online-ffmpeg-transform-your-media-processing-workflow-in-2024'],
    'ffmpeg-online-service-best-tools-for-video-audio-processing': ['ffmpeg-online-web-based-tools-and-script-generators', 'online-ffmpeg-transform-your-media-processing-workflow-in-2024'],
    'online-ffmpeg-transform-your-media-processing-workflow-in-2024': ['ffmpeg-online-web-based-tools-and-script-generators', 'ffmpeg-online-service-best-tools-for-video-audio-processing'],
    'zh-ffmpeg-batch-video-processing': ['zh-coolermaster-key-reset-super-key'],
    'zh-coolermaster-key-reset-super-key': ['zh-ffmpeg-batch-video-processing'],
}

FOOTER_MARK = '<!-- adapted: agicodehub -->'


def split_front(text: str) -> tuple[str, str]:
    """返回 (frontmatter, 正文)。"""
    if not text.startswith('---\n'):
        return '', text
    end = text.find('\n---\n', 4)
    if end == -1:
        return '', text
    return text[4:end], text[end + 5:]


def set_field(front: str, key: str, value: str) -> str:
    """替换或追加 frontmatter 字段（值按 JSON 转义）。"""
    import json
    line = f'{key}: {json.dumps(value, ensure_ascii=False)}'
    pattern = re.compile(rf'^{re.escape(key)}:.*$', re.M)
    if pattern.search(front):
        return pattern.sub(lambda _: line, front, count=1)
    return f'{front}\n{line}'


def normalize_headings(body: str, title: str) -> str:
    """旧 WordPress 正文用 ### 当一级小节，层级整体偏高一级。

    做法是把「最浅的小节」压到 ##，其余按同样偏移量平移，因此幂等：
    已经是 ## 起头的文章不会被动。开头与 title 完全相同的 h1 会去掉。
    """
    lines = body.split('\n')
    in_fence = False
    headings: list[tuple[int, int, str]] = []

    for idx, line in enumerate(lines):
        if line.startswith('```'):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        m = re.match(r'^(#{1,6}) (.+)$', line)
        if m:
            headings.append((idx, len(m.group(1)), m.group(2)))

    if not headings:
        return body

    def norm(t: str) -> str:
        return re.sub(r'\s+', ' ', t).strip().lower()

    keep = []
    drop = []
    for idx, level, text in headings:
        if level == 1 and norm(text) == norm(title):
            drop.append(idx)                 # 正文里又写了一遍标题
        else:
            keep.append((idx, level, text))

    if not keep:
        return body

    delta = 2 - min(level for _, level, _ in keep)
    for idx, level, text in keep:
        new_level = max(2, min(6, level + delta))
        lines[idx] = '#' * new_level + ' ' + text
    for idx in drop:
        lines[idx] = None                    # type: ignore[assignment]
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(l for l in lines if l is not None))


def fence_inline_commands(body: str) -> str:
    """整行就是一段行内代码的命令 → 独立代码块，并去掉多余的 \\" 转义。"""
    out, in_fence = [], False
    for line in body.split('\n'):
        if line.startswith('```'):
            in_fence = not in_fence
            out.append(line)
            continue
        if not in_fence:
            m = re.fullmatch(r'`([^`]+)`', line.strip())
            if m and re.match(r'^(ffmpeg|ffprobe|brew|sudo|apt|choco|#)', m.group(1).strip()):
                out.extend(['```', m.group(1).replace('\\"', '"').replace('\\<', '<'), '```'])
                continue
        out.append(line)
    return '\n'.join(out)


def build_footer(slug: str, lang: str) -> str:
    related = RELATED.get(slug, [])
    link = lambda other: f'[{TITLES.get(other, other)}](./{other}.md)'  # noqa: E731

    if lang == 'zh':
        note = ('::: tip 关于这篇旧文\n'
                '本文原发布于 dve2.com（2025 年 3 月），站点迁移时一并搬到 AGI Code Hub，'
                '文中的工具链接已更新为新站地址；命令与结论保持原样。\n'
                ':::')
        tools = (f'**相关工具**：[FFmpeg 命令工坊]({WORKBENCH}) · '
                 f'[浏览器内 FFmpeg 运行器]({RUNNER})')
        more = '**相关文章**：' + ' · '.join(link(o) for o in related) if related else ''
    else:
        note = ('::: tip About this article\n'
                'Originally published on dve2.com in March 2025. It moved to AGI Code Hub with the site migration; '
                'tool links now point at this site and the commands are unchanged.\n'
                ':::')
        tools = (f'**Related tools**: [FFmpeg Command Workbench]({WORKBENCH}) · '
                 f'[FFmpeg in-browser Runner]({RUNNER})')
        more = '**Related reading**: ' + ' · '.join(link(o) for o in related) if related else ''

    parts = ['', '---', '', note, '', tools]
    if more:
        parts.extend(['', more])
    parts.extend(['', FOOTER_MARK, ''])
    return '\n'.join(parts)



# 少量必须重写而不是替换的内容：旧文把自家工具写成了 VS Code 扩展，
# 新站是浏览器里的生成器，说法得改；还有裸 URL 要变成链接。
POST_FIXES: list[tuple[str, str, str]] = [
    (
        'how-to-crop-and-convert-gifs-using-ffmpeg',
        '## FFmpeg Command Workbench\n\nffmpeg.dve2.com\n\n'
        'FFmpeg Command Workbench is a Visual Studio Code extension designed to simplify the process of '
        'generating scripts for various FFmpeg operations. Whether you need to split videos, crop videos, '
        'or convert videos to GIFs, this tool provides an intuitive interface to create the necessary FFmpeg commands.',
        '## FFmpeg Command Workbench\n\n'
        f'[FFmpeg Command Workbench]({WORKBENCH}) runs in the browser on this site. Pick the task you need '
        '— split, crop, slideshow, GIF conversion — fill in a few inputs, and it assembles the FFmpeg command '
        'for you. Nothing to install, and you can run the result locally or paste it into the in-browser runner.',
    ),
    (
        'mp4-to-gif-ffmpeg-complete-conversion-guide',
        'For those who prefer automated solutions, try the FFmpeg Script Generator at ffmpeg.dve2.com. '
        'This online tool creates optimized conversion scripts based on your specific requirements, '
        'eliminating manual command-line work while ensuring professional results.',
        f'For those who prefer automated solutions, try the [FFmpeg Command Workbench]({WORKBENCH}). '
        'It builds optimized conversion scripts from your requirements, eliminating manual command-line '
        'work while keeping the output professional.',
    ),
    (
        'create-gifs-from-video-clips-with-ffmpeg-ultimate-guide',
        'visit https://agicodehub.com/ffmpeg-workbench to generate',
        f'visit the [FFmpeg Command Workbench]({WORKBENCH}) to generate',
    ),
]

TITLES = {}


def collect_titles(posts: dict[str, str]) -> None:
    import json
    for slug, text in posts.items():
        front, _ = split_front(text)
        m = re.search(r'^title:\s*(.+)$', front, re.M)
        if m:
            raw = m.group(1).strip()
            try:
                TITLES[slug] = json.loads(raw)
            except json.JSONDecodeError:
                TITLES[slug] = raw.strip('"\'')


def adapt(slug: str, text: str) -> str:
    front, body = split_front(text)
    lang = 'zh' if slug.startswith('zh-') else 'en'

    for pattern, repl in BRAND_PATTERNS:
        body = pattern.sub(lambda _: repl, body)

    body = normalize_headings(body, TITLES.get(slug, ''))
    body = fence_inline_commands(body)
    body = re.sub(r'\n{3,}', '\n\n', body).strip()

    for target, old, new in POST_FIXES:
        if target == slug and old in body:
            body = body.replace(old, new)

    if slug in DESCRIPTIONS:
        front = set_field(front, 'description', DESCRIPTIONS[slug])

    # 去掉上一次追加的页脚，保证幂等
    body = re.sub(rf'\n*---\n\n::: tip (关于这篇旧文|About this article)[\s\S]*?{re.escape(FOOTER_MARK)}\n?', '', body).rstrip()

    body = body.rstrip() + '\n' + build_footer(slug, lang)

    return f'---\n{front}\n---\n\n{body.lstrip()}'


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    files = {p.stem: p.read_text(encoding='utf-8') for p in sorted(POSTS.glob('*.md'))}
    collect_titles(files)

    changed = 0
    for slug, text in files.items():
        if slug == 'welcome':
            continue
        new = adapt(slug, text)
        if new == text:
            continue
        changed += 1
        if args.check:
            print(f'· {slug}: 需要适配（{len(text)} → {len(new)} 字符）')
        else:
            (POSTS / f'{slug}.md').write_text(new, encoding='utf-8')
            print(f'✓ {slug}')
    print(f'\n{"待适配" if args.check else "已适配"} {changed} 篇')


if __name__ == '__main__':
    main()
