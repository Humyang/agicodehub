---
layout: home
showHeroImage: true # Add this parameter to control hero image visibility
hero:
  name: "FFmpeg Tool Collection"
  text: "Quickly generate FFmpeg terminal commands"
  tagline: Your FFMPEG Assistant
  image:
    alt: FFmpeg Icon
    light: /img/ffmpeg.png
    dark: /img/ffmpeg.png

navigationCategories:
  - title: "Video"
    links:
      - text: "Video Crop/Split/Format Conversion"
        url: "https://www.agicodehub.com/ffmpegtool/video-split/index.html"
        forceRefresh: true
        description: "Quickly generate FFmpeg commands for cropping, splitting, and converting videos"
      - text: "FFmpeg/Slideshow"
        forceRefresh: true
        url: "https://www.agicodehub.com/ffmpegtool/slideshow/index.html"
        description: "Quickly generate FFmpeg commands for image transition videos"

  - title: "Image"
    links:
      - text: "Image Cropping"
        url: "https://www.agicodehub.com/ffmpegtool/image-crop/index.html"
        forceRefresh: true
        description: "Quickly generate FFmpeg commands for batch cropping directory images"
  - title: "Matting"
    links:
      - text: "Video/Image Matting"
        url: "/static/ffmpeghtml/mask.html"
        newWindow: true
        description: "Alpha channel matting, transparent background matting, chroma key matting"
---

<HomeLayout />
