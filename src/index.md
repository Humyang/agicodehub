---
layout: home
lang: en

hero:
  showHeroLogo: true
  text: "Witness the first handshake between human and AGI."
  tagline: Explore reusable AI-generated results
  image:
    alt: Icon of two crossed wrenches
    light: /optimized-images/img/light-lg.webp
    dark: /optimized-images/img/dark-lg.webp

features:
  - title: AI-Powered
    icon: <img src="/optimized-images/features/1-xs.webp" />
    details: Expand imagination, explore AI boundaries
  - title: All-Encompassing
    icon: <img src="/optimized-images/features/2-xs.webp" />
    details: Comprehensive utility tools to boost productivity
  - title: Cross-Platform
    icon: <img src="/optimized-images/features/3-xs.webp" />
    details: Accessible on any device browser, mobile-optimized
# --- Component configuration section ---
categories:
  - title: FFmpeg Tool
    desc: A collection of FFmpeg script generators to quickly create complex commands for tasks like matting, watermark removal, cropping, and more.
    icon: ffmpeg
    iconType: ffmpegplay
    link: /ffmpegtool/
    # badge: 120+
    tags: ["FFMPEG", "Generator", "Script"]
    theme: blue # Corresponds to .theme-blue in CSS

  - title: Code Tools
    desc: Offline IDE, small tool collections, and more.
    icon: googleicon googleicon-select-all
    switchIcons:
          - googleicon googleicon-invert-colors
          - googleicon googleicon-edit-off
          - googleicon googleicon-remove-shopping-cart
          - googleicon googleicon-commute
    # link: /nav/design
    # link: "/static/codetool/offlinehtml.html"
    link: "/codetool/"
    # badge: 85+
    # tags: ["UI/UX", "Icons", "Color Schemes"]
    theme: purple

  - title: UI Resources
    desc: 2400+ Stylized icons.
    # icon: fa-solid fa-chart-line
    icon: googleicon googleicon-sports-handball
    switchIcons:
          - googleicon googleicon-sports-basketball
          - googleicon googleicon-sports-football
          - googleicon googleicon-sports-baseball
          - googleicon googleicon-sports-volleyball
          
    link: /ui/
    badge: 2400+ 
    tags: ["Icons", "UI Design"]
    theme: orange
---

<HomeNav />
<ThemeTransition />