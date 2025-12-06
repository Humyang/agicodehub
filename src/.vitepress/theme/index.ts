// // https://vitepress.dev/guide/custom-theme
// import DefaultTheme from 'vitepress/theme'

// // Import Stylus files
// import './styles/base.styl'

// // Import Global plugins
// import 'element-plus/theme-chalk/dark/css-vars.css'

// import { VueQueryPlugin } from '@tanstack/vue-query'

// import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'

// // Import icon components
// import { IconBugReport, IconDownload } from '@iconify-prerendered/vue-mdi'

// // Import vitepress-plugin-image-viewer
// import 'viewerjs/dist/viewer.min.css'
// import imageViewer from 'vitepress-plugin-image-viewer'
// import vImageViewer from 'vitepress-plugin-image-viewer/lib/vImageViewer.vue'
// import { useRoute } from 'vitepress'

// import Layout from './Layout.vue'

// Import tag manager
import tagManager from './plugin/tagManager'
import tagManagerFallBack from './plugin/tagManagerFallBack'

// // Import adsense
// import Adsense from './components/adsense.vue'

// export default {
//   extends: DefaultTheme,
//   enhanceApp({ app }) {
//     app.use(VueQueryPlugin)
//     enhanceAppWithTabs(app)
//     app.component('IconDownload', IconDownload)
//     app.component('IconBugReport', IconBugReport)
//     tagManager({ id: 'GTM-NM64V2DN' })
//     tagManagerFallBack({ id: 'GTM-NM64V2DN' })
//     app.component('Adsense', Adsense)
//     app.component('vImageViewer', vImageViewer)
//   },
//   setup() {
//     // Image Viewer
//     const route = useRoute()
//     imageViewer(route)
//   },
//   Layout,
// }
import { h, watchEffect } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './styles/tailwind.css'
import HomeLayout from './components/HomeLayout.vue'
import ThemeTransition from './components/ThemeTransition.vue'
// import ToolsPage from './pages/tools.vue'
// import CustomComponent from './components/CustomComponent.vue'
import './styles/home.css'
import './styles/custom_sprite.css'; // 引入全局 CSS
import './styles/googleicon.css'; // 引入全局 CSS
import './styles/googleicon2.css'; // 引入全局 CSS
// import { VueQueryPlugin } from '@tanstack/vue-query'
import Layout from './Layout.vue'
// import VideoHero from './VideoHero.vue'
// import GemFeature from './components/GemFeature.vue'

// import MyVPHero from './components/VPHero.vue'
import OptimizedImage from './components/OptimizedImage.vue'
import HomeNav from './components/HomeNav.vue'
import NavPage from './components/NavPage.vue'
export default {

  extends: DefaultTheme,
  enhanceApp({ app }) {
    // app.use(VueQueryPlugin)
    // app.component('MyVPHero', MyVPHero)
    // app.component('VideoHero', VideoHero)
    app.component('HomeNav', HomeNav)
    app.component('NavPage', NavPage)
    app.component('HomeLayout', HomeLayout)
    app.component('ThemeTransition', ThemeTransition)
    app.component('OptimizedImage', OptimizedImage)
    // Add theme transition styles
    // if (typeof document !== 'undefined') {
    //   const style = document.createElement('style')
    //   style.textContent = `
    //     .vitepress-theme-transition {
    //       transition: all 0.3s ease-in-out;
    //     }
    //     .vitepress-theme-transition * {
    //       transition: inherit;
    //     }
    //   `
    //   document.head.appendChild(style)
    // }
    tagManager({ id: 'G-QEKHDPCR27' })
    tagManagerFallBack({ id: 'G-QEKHDPCR27' })
    // app.component('ToolsPage', ToolsPage)
    // app.component('CustomComponent', CustomComponent)
  },
  // setup() {
  //   // Image Viewer
  //   const route = useRoute()
  //   imageViewer(route)
  // },
  Layout,
} satisfies Theme