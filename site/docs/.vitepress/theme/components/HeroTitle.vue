<!-- .vitepress/theme/components/HeroTitle.vue -->
<template>
  <div class="code-hero-container">
    <div class="code-logo">
      <span class="tag">&lt;</span><span class="highlight-agi">Agi</span
      ><span class="val">Code</span><span class="highlight-hub">Hub</span
      ><span class="tag">/&gt;</span><span class="cursor"></span>
    </div>
  </div>
</template>

<style scoped>
/* 引入之前的 CSS，稍微调整以适应 VitePress 布局 */
.code-hero-container {
  display: flex;
  /* justify-content: center;  */
  /* 居中显示 */
  margin-bottom: 20px;
}

.code-logo {
  font-family: "Fira Code", monospace; /* 确保你引入了这个字体，或者用默认等宽 */
  font-size: 56px; /* 调整大小适配 Hero */
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-text-1); /* 使用 VitePress 主题变量适应深色/浅色模式 */
}

.tag {
  color: #569cd6;
}
.val {
  /* color: #ce9178; */
  color: #f56e40;
}
.highlight-agi {
  /* color: #c586c0; */
  color: #e14441;
}
.highlight-hub {
  /* color: #4ec9b0; */
  color: #ffeb59;
}

/* 光标动画 */
.cursor {
  display: inline-block;
  width: 10px;
  height: 1em;
  background-color: var(--vp-c-text-1);
  margin-left: 5px;
  vertical-align: text-bottom;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .code-logo {
    font-size: 32px;
  }
}
</style>