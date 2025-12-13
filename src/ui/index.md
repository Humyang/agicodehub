---
layout: home
# showHeroImage: true # Add this parameter to control hero image visibility

hero:
  name: "UI Resources"
  text: "Ready-to-use UI Resources"
  tagline: Icon Stylization
  image:
    alt: uiicon
    light: /images/img/uiicon.webp
    dark: /images/img/uiicon.webp
navGroups:
  - id: Material-Design-icon
    title: Material Design
    link: https://fonts.google.com/icons?icon.set=Material+Icons&icon.size=24&icon.color=%238C1AF6&icon.platform=web
    items:
      - title: Cyberpunk Style Icons
        desc: Element UI icon conversion
        link: "/static/ui/iconstyle/googleicon/Cyberpunk/index.html"
        icon: "googleicon googleicon-swipe-vertical"
        switchIcons:
          - googleicon googleicon-swipe-vertical
          - googleicon googleicon-nightlight-round
          - googleicon googleicon-sentiment-neutral
          - googleicon googleicon-sports-handball
          - googleicon googleicon-sports-baseball
          
        tag: Popular
  - id: icon-style
    title: Element UI
    link: https://element.eleme.cn/#/en-US/component/icon
    items:
      - title: Cyberpunk Style Icons
        desc: Element UI icon conversion
        link: "/static/ui/iconstyle/elementui/Cyberpunk/index.html"
        icon: "el-icon el-icon-platform-eleme"
        switchIcons:
          - el-icon el-icon-platform-eleme
          - el-icon el-icon-camera-solid
          - el-icon el-icon-message-solid
          - el-icon el-icon-cherry
          
        tag: Popular
---

<NavPage />