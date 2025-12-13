---
layout: home
showHeroImage: true # Add this parameter to control hero image visibility
hero:
  name: "FFmpeg Tool"
  text: "Assist in generating complex FFmpeg commands"
  tagline: Your FFMPEG Assistant
  image:
    alt: Ffmpeg Icon
    light: /img/ffmpeg.png
    dark: /img/ffmpeg.png

navGroups:
  
  - id: script-generate
    title: Script Generators
    items:
      - title: Video Trimming/Splitting
        desc: Quickly generate script code for ffmpeg trimming, splitting, and converting to GIF, with the option to run online.
        link: /static/ffmpegtool/video-split/index.html
        icon: "el-icon el-icon-edit"
        tag: Popular
      - title: Transition Effects
        desc: Create videos from images with transition effects, including random addition functionality.
        icon: "el-icon el-icon-rank"
        link: /static/ffmpegtool/slideshow/index.html
        tag: Popular
      - title: Image Cropping
        desc: Generate scripts to batch crop images in a directory.
        icon: "el-icon el-icon-scissors"
        link: /static/ffmpegtool/image-crop/index.html
        tag: Popular
      - title: Add/Remove Watermark
        icon: "el-icon el-icon-hot-water"
        desc: Scripts for adding watermarks and covering specified areas with block overlays.
        link: "/static/ffmpeghtml/delogo_overlay.html"
        tag: Popular
      - title: Video/Image Matting
        desc: Alpha channel matting, transparent background matting, chroma key matting.
        icon: "el-icon el-icon-s-check"
        link: "/static/ffmpeghtml/mask.html"
        tag: Popular
  - id: other-tool
    title: Other Tools
    items:
      - title: WebM Viewer
        desc: Check if a WebM video has a transparent background and if the browser supports transparent display.
        link: "/static/ffmpeghtml/videoview.html"
        icon: "el-icon el-icon-view"
        tag: Popular
      - title: Parameter Collection Generator
        icon: "el-icon el-icon-files"
        desc: FFmpeg Parameter Generator (with crop preview)
        link: "/static/ffmpeghtml/config.html"
        tag: Popular
---
<NavPage />
