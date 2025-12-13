---
layout: home
showHeroImage: true # Add this parameter to control hero image visibility
hero:
  name: "FFmpeg 工具集合"
  text: "辅助生成复杂的FFmpeg命令"
  tagline: 您的FFMPEG好帮手
  image:
    alt: Sun and Moon Icon
    light: /img/ffmpeg.png
    dark: /img/ffmpeg.png

navGroups:
  
  - id: script-generate
    title: 脚本生成器
    items:
      - title: 视频裁剪/分割
        desc: 快速生成ffmpeg裁剪、分割、转换GIF的脚本代码，还可以在线运行。
        link: /static/ffmpegtool/video-split/index.html
        icon: "el-icon el-icon-edit"
        tag: 热门
      - title: 过渡效果
        desc: 图片合成视频添加过渡效果，支持随机添加功能。
        icon: "el-icon el-icon-rank"
        link: /static/ffmpegtool/slideshow/index.html
        tag: 热门
      - title: 图片裁剪
        desc: 生成可以批量裁剪目录下图片的脚本。
        icon: "el-icon el-icon-scissors"
        link: /static/ffmpegtool/image-crop/index.html
        tag: 热门
      - title: 加水印和去水印
        icon: "el-icon el-icon-hot-water"

        desc: 添加水印和添加方块遮住指定区域相关脚本。
        link: "/static/ffmpeghtml/delogo_overlay.html"
        tag: 热门
      - title: 视频/图片抠图
        desc: 通道抠图、透明背景抠图、颜色键抠图。
        icon: "el-icon el-icon-s-check"
        link: "/static/ffmpeghtml/mask.html"
        tag: 热门
  - id: other-tool
    title: 其它工具
    items:
      - title: webm查看器
        desc: 查看webm视频背景是否透明以及浏览器是否支持透明显示。
        link: "/static/ffmpeghtml/videoview.html"
        icon: "el-icon el-icon-view"
        tag: 热门
      - title: 参数集合生成器
        icon: "el-icon el-icon-files"
        desc: FFmpeg 参数生成器 (含裁剪预览)
        link: "/static/ffmpeghtml/config.html"
        tag: 热门
---
<NavPage />
