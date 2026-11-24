---
title: "使用FFmpeg高效处理大批量视频"
date: 2025-03-04
description: "批量转码的实战套路：for 与 find/xargs 遍历、并行度按核数分配、临时文件防半成品、失败清单与断点续跑脚本。"
tags: [FFmpeg]
legacy_id: 195
legacy_url: "https://www.dve2.com/zh/archives/195/使用ffmpeg高效处理大批量视频/"
restored_from: wayback
---

# 使用FFmpeg高效处理大批量视频

一个目录里躺着几百个素材，逐个敲 ffmpeg 不现实，而随手写的 `for f in *.mp4` 又会撞上三件事：文件名带空格被截断、输出写回源目录覆盖原片、跑到一半中断后不知道哪些已经做完。这篇只讲批量这一层——循环怎么写、`find` 怎么接 `xargs`、并行开几个、日志与断点续跑怎么做。

## 先固定单条命令

批量之前先把单条参数调对，否则错误会被重复几百次。下面是"归档 + 网页可播"这类常见目标的转码命令：

```bash
ffmpeg -nostdin -hide_banner -loglevel error -y -i input.mov \
  -map 0:v:0 -map 0:a? \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  -movflags +faststart output.mp4
```

- `-nostdin`：不让 ffmpeg 抢占标准输入。放进循环或 `xargs` 后缺了它，后面的任务会静默退出，看起来像"什么都没发生"。
- `-map 0:v:0 -map 0:a?`：只取第一路视频和（若存在的）音频。默认流选择遇到多音轨、封面图、内嵌字幕时结果往往不是你想要的，`?` 表示该流不存在时不报错。
- `-pix_fmt yuv420p`：保证输出在播放器和浏览器里都能解。
- `-movflags +faststart`：索引挪到文件头，支持边下边播。
- `-crf` 越小越清晰、文件越大；`-preset` 是速度与压缩率的取舍。两个值先用同一个片段试，别在几百个文件上试。

## for 循环：只在单层目录、文件名干净时用

```bash
mkdir -p out
for f in *.mov; do
  [ -e "$f" ] || continue
  base="${f%.*}"
  ffmpeg -nostdin -hide_banner -loglevel error -y -i "$f" \
    -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
    -c:a aac -b:a 128k "out/$base.mp4"
done
```

几处必须写对：变量一律加双引号，少一对就少一种文件名能处理；`${f%.*}` 去掉最后一个扩展名；`[ -e "$f" ] || continue` 兜住目录为空时 glob 原样返回字面量 `*.mov` 的情况（也可以用 `shopt -s nullglob`）。

最大的坑是输出位置：若 `out/` 写成 `.` 且源文件本来就是 mp4，`-y` 会原地覆盖源文件，没有提示。输出永远另置目录。

## find + xargs：子目录、空格、换行

`find . -name '*.mov'` 的结果按换行分隔，文件名带空格就断成两条。正确接法是 `-print0` 配 `xargs -0`。并行时每个任务要自己算输出路径，所以用 `bash -c` 包一层：

```bash
find raw -type f -iname '*.mov' -print0 \
| xargs -0 -n1 -P4 bash -c '
    f="$1"
    out="out/${f#raw/}"
    out="${out%.*}.mp4"
    mkdir -p "$(dirname "$out")"
    ffmpeg -nostdin -hide_banner -loglevel error -y -i "$f" \
      -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
      -threads 2 -c:a aac -b:a 128k "$out"
  ' _
```

结尾那个 `_` 占住子 shell 的 `$0`，真正的参数才落在 `$1`，漏了它 `$1` 就是别的值。`${f#raw/}` 剥掉前缀、保留相对路径，输出目录结构自动跟源目录对齐。用 `-iname` 而不是 `-name`，能一并吃下 `.MOV`。

## 并行度定几个

要盯的是一个乘法关系：`-P` 的进程数 × 每个进程实际开的线程数 ≈ 可用核数。x264 默认按核数自行开线程，所以在 8 核机上直接 `-P8` 是严重超订，总耗时经常比 `-P4` 更长。

- CPU 密集（`libx264` 重新编码）：`-P` 取核数的一半左右，每进程加 `-threads 2`，先拿十个文件跑一遍看负载。
- I/O 密集（`-c copy` 换容器、抽音轨）：`-P` 可以拉到 8 以上，瓶颈在磁盘不在 CPU。
- 机械盘、外接盘、网络盘：并行数越高越差，磁头来回找的代价盖掉全部收益，这类盘上串行更快。

没有通用数字，量一次比记公式可靠。核数用 `nproc`（Linux）或 `sysctl -n hw.ncpu`（macOS）取。

## 日志、失败清单、断点续跑

批量真正难的不是转码，是中断之后重来。要点只有一条：**别用"输出文件是否存在"判断已完成**。ffmpeg 开始写盘时就创建了输出文件，中途 Ctrl-C 之后它仍在，只是内容残缺，续跑会把它当成做完的。

做法是写临时文件 `.part`，成功后 `mv` 成正式名，完成标记落到单独目录：

```bash
#!/usr/bin/env bash
set -uo pipefail

SRC=raw
DST=out
MARK=.done
LOG=batch.log
FAIL=failed.txt
JOBS=4

mkdir -p "$DST" "$MARK"

process() {
  f="$1"
  rel="${f#"$SRC"/}"
  out="$DST/${rel%.*}.mp4"
  tmp="$out.part.mp4"

  [ -f "$MARK/$rel.done" ] && return 0
  mkdir -p "$(dirname "$out")"

  if ffmpeg -nostdin -hide_banner -loglevel error -y \
      -i "$f" -map 0:v:0 -map 0:a? \
      -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -threads 2 \
      -c:a aac -b:a 128k -movflags +faststart \
      "$tmp" 2>>"$LOG"; then
    mv "$tmp" "$out"
    : > "$MARK/$rel.done"
  else
    rm -f "$tmp"
    printf '%s\n' "$f" >> "$FAIL"
  fi
}
export -f process
export SRC DST MARK LOG FAIL

find "$SRC" -type f \( -iname '*.mov' -o -iname '*.mp4' -o -iname '*.mkv' \) -print0 \
| xargs -0 -n1 -P"$JOBS" bash -c 'process "$1"' _
```

- `set -uo pipefail`：未定义变量直接报错，且 `find | xargs` 管道里的失败不被吞掉。故意没开 `-e`，单个文件失败不该终止整批。
- `export -f process` 与变量导出都不能省：`bash -c` 起的是新 shell，不导出就找不到函数。
- 重跑同一条命令就是续跑，`.done` 里有的跳过，`failed.txt` 是失败清单。修好后单进程重试：`while IFS= read -r f; do process "$f"; done < failed.txt`。
- 进度另开一路看：`-progress pipe:1` 把关键字段按 `key=value` 打到 stdout，或者 `tail -f batch.log`。

## 常见报错

| 现象 | 原因 | 改法 |
| --- | --- | --- |
| 后续任务全部静默退出 | 没加 `-nostdin` | 命令前段补 `-nostdin` |
| 音频编码报不支持 | mp4 容器不接受源音频编码 | `-c:a aac`；采样率怪异再补 `-ar 48000` |
| 尺寸奇数导致编码失败 | 缩放后宽高为奇数 | 用 `scale=-2:720`，`-2` 让另一维取偶数 |
| 续跑跳过了残缺文件 | 用文件是否存在做判断 | 换 `.part` + `.done` 标记 |
| 带空格的文件只处理一半 | 未加引号或未用 `-print0` | 引号 + `-print0` / `xargs -0` |

参数记不住、想先拼好单条再粘回脚本的，可以用 [FFmpeg 命令工坊](https://agicodehub.com/ffmpeg-workbench) 拼一遍；批量逻辑仍建议自己拿着，出问题才好定位。

---

::: tip 关于这篇旧文
本文原发布于 dve2.com（2025 年 3 月），站点迁移时一并搬到 AGI Code Hub，文中的工具链接已更新为新站地址；命令与结论保持原样。
:::

**相关工具**：[FFmpeg 命令工坊](https://agicodehub.com/ffmpeg-workbench) · [浏览器内 FFmpeg 运行器](https://agicodehub.com/ffmpeg-script-tool)

**相关文章**：[酷冷至尊机械键盘键位重置win 键失效 ubuntu下 super键无效](./zh-coolermaster-key-reset-super-key.md)

<!-- adapted: agicodehub -->
