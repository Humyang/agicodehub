<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6996805384183695'
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)
  }
  // Initialize ad
  window.adsbygoogle = window.adsbygoogle || []
  window.adsbygoogle.push({})
})
</script>

<template>
  <ins
    class="adsbygoogle"
    style="display:block; text-align:center;"
    data-ad-layout="in-article"
    data-ad-format="fluid"
    data-ad-client="ca-pub-6996805384183695"
    data-ad-slot="9768744078"
  />
</template>
