---
layout: home
showHeroImage: true # Add this parameter to control hero image visibility
hero:
  name: "FFmpeg 工具集合"
  text: "快速生成ffmpeg终端运行代码"
  tagline: 您的FFMPEG好帮手
  image:
    alt: Sun and Moon Icon
    light: /img/ffmpeg.png
    dark: /img/ffmpeg.png

# navigationCategories:
#   - title: "视频"
#     links:
#       - text: "视频裁剪/分割/格式转换"
#         url: "https://www.agicodehub.com/ffmpegtool/video-split/"
#         forceRefresh: true
#         description: "快速生成ffmpeg裁剪、分割、格式转换视频的代码"
#       - text: "ffmpeg/slideshow"
#         forceRefresh: true
#         url: "https://www.agicodehub.com/ffmpegtool/slideshow/"
#         description: "快速生成ffmpeg图片过渡视频代码"

#   - title: "图片"
#     links:
#       - text: "图片裁剪"
#         url: "https://www.agicodehub.com/ffmpegtool/image-crop/"
#         forceRefresh: true
#         description: "快速生成ffmpeg批量裁剪目录图片代码"
#   - title: "填充-去水印"
#     links:
#       - text: "去水印、填充色块"
#         # url: "delogo_overlay.html"
#         url: "/static/ffmpeghtml/delogo_overlay.html"
#         newWindow: true
#         description: "图片或视频填充色块和去除水印"

#   - title: "抠图"
#     links:
#       - text: "视频/图片抠图"
#         url: "/static/ffmpeghtml/mask.html"
#         newWindow: true
#         description: "通道抠图、透明背景抠图、颜色键抠图"
#       - text: "查看视频"
#         url: "/static/ffmpeghtml/videoview.html"
#         newWindow: true
#         description: "查看视频的透明效果"

navGroups:
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
  - id: script-generate
    title: 脚本生成器
    # icon: fa-solid fa-layer-group
    items:
      - title: 视频裁剪/分割
        desc: 快速生成ffmpeg裁剪、分割、转换GIF的脚本代码，还可以在线运行。
        link: /static/ffmpegtool/video-split/index.html
        icon: "el-icon el-icon-edit"
        # logo: https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg
        tag: 热门
      - title: 过渡效果
        desc: 图片合成视频添加过渡效果，支持随机添加功能。
        icon: "el-icon el-icon-rank"
        link: /static/ffmpegtool/slideshow/index.html
        # logo: https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg
        tag: 热门
      - title: 图片裁剪
        desc: 生成可以批量裁剪目录下图片的脚本。
        icon: "el-icon el-icon-scissors"
        link: /static/ffmpegtool/image-crop/index.html
        # logo: https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg
        tag: 热门
      - title: 加水印和去水印
        icon: "el-icon el-icon-hot-water"

        desc: 添加水印和添加方块遮住指定区域相关脚本。
        link: "/static/ffmpeghtml/delogo_overlay.html"
        # logo: https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg
        tag: 热门
      - title: 视频/图片抠图
        desc: 通道抠图、透明背景抠图、颜色键抠图。
        icon: "el-icon el-icon-s-check"
        link: "/static/ffmpeghtml/mask.html"
        # logo: https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg
        tag: 热门
      # - title: Sketch
      #   desc: Mac 端经典的矢量绘图工具。
      #   link: https://www.sketch.com
      #   logo: https://upload.wikimedia.org/wikipedia/commons/5/59/Sketch_Logo.svg
      #   tag: MacOS

  # - id: icon-assets
  #   title: 图标素材
  #   icon: fa-solid fa-icons
  #   items:
  #     - title: Iconfont
  #       desc: 阿里巴巴矢量图标库，国内最大。
  #       link: https://www.iconfont.cn
  #       logo: https://img.alicdn.com/tps/i4/TB1_oz6KVXXXXaFXpXXJDFnIXXX-64-64.ico
  #       tag: 免费
  #     - title: Font Awesome
  #       desc: 著名的图标字体库。
  #       link: https://fontawesome.com
  #       tag: 开发必备

  # - id: colors
  #   title: 配色灵感
  #   icon: fa-solid fa-palette
  #   items:
  #     - title: Coolors
  #       desc: 快速生成配色方案。
  #       link: https://coolors.co
  #       tag: 生成器
---

<!--
<HomeLayout />

--- -->

<!-- 调用组件 -->
<NavPage />
