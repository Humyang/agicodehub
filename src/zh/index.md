---
layout: home
lang: zh-CN

hero:
  
  showHeroLogo: true
  text: "在这里，见证人类智慧与 AGI 的第一次握手。"
  tagline: 探索可重用的AI生成结果
  image:
    alt: 两个扳手交叉的图标
    light: /optimized-images/img/light-lg.webp
    dark: /optimized-images/img/dark-lg.webp

features:
  - title: AI 赋能
    icon: <img src="/optimized-images/features/1-xs.webp" />
    details: 扩展想象力，探索AI边界
  - title: 包罗万象
    icon: <img src="/optimized-images/features/2-xs.webp" />
    details: 实用工具大全，提升生产力
  - title: 跨平台
    icon: <img src="/optimized-images/features/3-xs.webp" />
    details: 任意设备浏览器访问，移动端优化
# --- 这里是组件的配置项 ---
categories:
  - title: FFmpeg 工具集合
    desc: FFmpeg 脚本生成器集合，快速生成抠图、去水印、裁剪等FFmpeg复杂命令。
    icon: ffmpeg
    iconType: ffmpegplay
    link: /zh/ffmpegtool/
    # badge: 120+
    tags: ["FFMPEG", "生成器", "Script"]
    theme: blue # 对应 CSS 中的 .theme-blue

  - title: 代码工具
    desc: 离线IDE、小工具集合等。
    icon: el-icon el-icon-setting
    # link: /nav/design
    # link: "/static/codetool/offlinehtml.html"
    link: "/zh/codetool/"
    # badge: 85+
    # tags: ["UI/UX", "图标", "配色"]
    theme: purple

  - title: UI资源
    desc: 风格化图标。
    # icon: fa-solid fa-chart-line
    icon: el-icon el-icon-loading
    link: /zh/ui/
    badge: 60+
    tags: ["图标", "UI设计"]
    theme: orange
navigationCategories:
  - title: "FFmpeg工具集合"
    moreLink:
      text: "查看更多"
      url: "/zh/ffmpegtool/"
      description: "探索更多FFmpeg工具"
    links:
      - text: "视频裁剪/分割/格式转换"
        url: "https://www.agicodehub.com/ffmpegtool/video-split/"
        forceRefresh: true
        description: "快速生成ffmpeg裁剪、分割、格式转换视频的代码"

      - text: "slideshow"
        url: "https://www.agicodehub.com/ffmpegtool/slideshow/"
        forceRefresh: true
        description: "快速生成ffmpeg图片过渡视频代码"
      - text: "image crop"
        url: "https://www.agicodehub.com/ffmpegtool/image-crop/"
        forceRefresh: true
        description: "快速生成ffmpeg批量裁剪目录图片代码"
  - title: "代码工具"
    moreLink:
      text: "查看更多"
      url: "/zh/codetool/"
      # url: "/static/codetool/offlinehtml.html"
      description: "探索更多FFmpeg工具"
    links:
      - text: "离线IDE"
        url: "/static/codetool/offlinehtml.html"
        newWindow: true
        description: "没有网络也能运行HTML，支持导入和导出，适合AI生成的小工具运行演示"

  - title: "日志"
    moreLink:
      text: "查看更多"
      url: "/docs/logs/domain-plan/"
      description: "探索更多AI工具"
    links:
      - text: "开发日志"
        url: "/docs/logs/develop-log"
---

<HomeNav />
<ThemeTransition />
