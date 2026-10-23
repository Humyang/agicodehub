/* eslint-disable */
/**
 * Legacy tool i18n bridge.
 *
 * The migrated static HTML tools were written as single-language pages
 * (mostly English, a couple Chinese). This script adds a thin translation
 * layer on top of them so they follow the language of the surrounding app:
 *
 *   - the language is read from `?lang=xx`, then from the shared
 *     `localStorage.locale` (same origin as the app), then from the browser;
 *   - the host app can also push a locale at any time by calling
 *     `window.__legacyI18n.apply('zh')` or by posting
 *     `{ type: 'legacy-i18n', locale: 'zh' }`;
 *   - a MutationObserver re-applies the translation when a framework
 *     (e.g. the Next.js build of the Script Tool) re-renders its DOM.
 *
 * Only exact, normalised matches are translated, so generated code samples
 * and command strings are left untouched.
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- EN → ZH */
  var EN_ZH = {
    /* --- FFmpeg Grid Image Tool ------------------------------------- */
    'FFmpeg Grid Image Tool': 'FFmpeg 九宫格图片工具',
    '🛠️ Canvas & Mode': '🛠️ 画布与模式',
    '⚡ Last layout & position restored': '⚡ 已恢复上次的布局与位置',
    '💾 Export Config': '💾 导出配置',
    '📂 Import Config': '📂 导入配置',
    'Output Type': '输出类型',
    '🖼️ Static Image': '🖼️ 静态图片',
    '🎬 Motion Video': '🎬 动态视频',
    'Entrance Animation': '入场动画',
    'Fade In': '淡入',
    '↑ Slide Up': '↑ 上滑',
    '↓ Slide Down': '↓ 下滑',
    '← Slide Left': '← 左滑',
    '→ Slide Right': '→ 右滑',
    'Video Duration (sec)': '视频时长（秒）',
    'ℹ️ Smaller numbers appear first (custom order supported)': 'ℹ️ 序号越小越靠前（支持自定义顺序）',
    'Resolution / Platform Preset': '分辨率 / 平台预设',
    '1:1 Square (WeChat/INS)': '1:1 方形（微信/INS）',
    '16:9 Landscape (Video Cover)': '16:9 横版（视频封面）',
    'Custom Size...': '自定义尺寸…',
    '3:4 Xiaohongshu/INS Vertical (1242x1660)': '3:4 小红书/INS 竖版（1242x1660）',
    '9:16 Douyin/TikTok (1080x1920)': '9:16 抖音/TikTok（1080x1920）',
    '2.35:1 Official Account Header (900x383)': '2.35:1 公众号头图（900x383）',
    '16:9 Official Account Article (1080x608)': '16:9 公众号文章（1080x608）',
    'Width (px)': '宽（px）',
    'Height (px)': '高（px）',
    'Layout Templates': '布局模板',
    '-- Select Layout --': '-- 选择布局 --',
    '1 Grid (Single/Cover)': '1 宫格（单图/封面）',
    '2 Grid': '2 宫格',
    '3 Grid': '3 宫格',
    '4 Grid (2x2)': '4 宫格（2x2）',
    '6 Grid (2x3)': '6 宫格（2x3）',
    '9 Grid (3x3)': '9 宫格（3x3）',
    'Left Hero (1 large, 2 small)': '左侧主图（1 大 2 小）',
    'Top Hero (1 large, 3 small)': '顶部主图（1 大 3 小）',
    'Center Focus (1 large, 2 narrow)': '中心聚焦（1 大 2 窄）',
    'Two Rows': '两行',
    'Three Rows': '三行',
    'Top 1, Bottom 2': '上 1 下 2',
    'Top 2, Bottom 1': '上 2 下 1',
    '5 Grid (Top 2, Bottom 3)': '5 宫格（上 2 下 3）',
    '7 Grid (Top 3, Bottom 4)': '7 宫格（上 3 下 4）',
    '8 Grid (Top 4, Bottom 4)': '8 宫格（上 4 下 4）',
    'Global Gap:': '全局间距：',
    'Selected Slot Settings': '选中格子设置',
    'or': '或',
    '📂 Load Custom JSON': '📂 加载自定义 JSON',
    '⬇ Download Required Background': '⬇ 下载所需背景',
    'Asset Management': '素材管理',
    '+ Add Slot Images (Multiple)': '+ 添加格子图片（可多选）',
    '+ Add Free Stickers (Logo/Watermark)': '+ 添加自由贴纸（Logo/水印）',
    '✂️ Upload & Split Single Image': '✂️ 上传并切分单张图片',
    'Clear All': '全部清空',
    '🚀 Export Command': '🚀 导出命令',
    'Export Slots as Images': '将格子导出为图片',
    '📋 Copy Command': '📋 复制命令',
    '📄 Output: collage_output.png': '📄 输出：collage_output.png',
    '* Video mode auto-fixes odd resolutions.': '* 视频模式会自动修正奇数分辨率。',
    '* Ensure all assets are in the same directory.': '* 请确保所有素材位于同一目录。',
    '⌨ When selected: Arrow keys to move | +/- to scale | R to reset': '⌨ 选中后：方向键移动 | +/- 缩放 | R 重置',
    'Basic Grid': '基础网格',
    'Creative Layouts (New)': '创意布局（新增）',
    'Fit': '适应',
    'Flip Horizontal': '水平翻转',
    'Flip Vertical': '垂直翻转',
    'General': '通用',
    'Mixed Grid': '混合网格',
    'Reset': '重置',
    'Rotate': '旋转',
    'Row Layouts': '行列布局',
    'Social Media': '社交媒体',
    'Background': '背景',
    'Cache parse error': '缓存解析失败',
    'Missing Image': '图片缺失',
    'Please select a template first': '请先选择一个模板',

    /* --- Icon Sprite Paginator -------------------------------------- */
    'Icon Sprite Paginator': '图标雪碧图分页器',
    'Import / Restore': '导入 / 恢复',
    'Drag & Drop CSS here': '把 CSS 拖到这里',
    'or Click to Upload': '或点击上传',
    'Parses CSS to:': '解析 CSS 用于：',
    'Detect Base Class & Prefix': '自动识别基础类名与前缀',
    'Add matching icons to selection': '把匹配的图标加入选择',
    'Naming Settings': '命名设置',
    'Base Class Name': '基础类名',
    'Item Class Prefix': '图标类名前缀',
    'Visual Settings': '视觉设置',
    'CSS Display Size': 'CSS 显示尺寸',
    'Lock Aspect Ratio': '锁定宽高比',
    '(Note: Export keeps original image size; CSS handles scaling)': '（注：导出保持原始图片尺寸，缩放由 CSS 控制）',
    'Preview Background (Exports use this)': '预览背景（导出时使用）',
    'Preview Background': '预览背景',
    'Export Options': '导出选项',
    'Image Format': '图片格式',
    'WebP (Smaller size)': 'WebP（体积更小）',
    'PNG (Better compatibility)': 'PNG（兼容性更好）',
    'CSS / Usage Code': 'CSS / 使用代码',
    'Copy CSS': '复制 CSS',
    'Guide': '使用指南',
    'Select All': '全选',
    'Clear': '清空',
    'Show All Status': '显示全部状态',
    'Selected Only': '仅已选',
    'Unselected Only': '仅未选',

    /* --- Transparent background video demo -------------------------- */
    'Transparent Background Video Playback Test': '透明背景视频播放测试',
    'Explore multiple technical solutions for playing videos with transparent backgrounds in browsers. Detect browser support for alpha channel videos, suitable for effects, overlays, design scenarios.':
      '探索在浏览器中播放透明背景视频的多种技术方案：检测浏览器对 Alpha 通道视频的支持，适用于特效、叠加、设计等场景。',
    'Upload Video File for Preview': '上传视频文件预览',
    'Solution 1: WebM + VP9 Encoding': '方案一：WebM + VP9 编码',
    'Use WebM format with VP9 encoding that supports alpha channels for transparent backgrounds.':
      '使用支持 Alpha 通道的 WebM + VP9 编码实现透明背景。',
    'Your browser does not support WebM video format': '你的浏览器不支持 WebM 视频格式',
    'Transparent Background': '透明背景',
    'Gradient Background': '渐变背景',
    'Pattern Background': '图案背景',
    'Play': '播放',
    'Pause': '暂停',
    'Solution 2: Canvas Drawing': '方案二：Canvas 绘制',
    'Use Canvas to process video frame by frame, achieving custom transparency effects and interactions.':
      '通过 Canvas 逐帧处理视频，实现自定义透明效果与交互。',
    'Solution 3: CSS Blend Modes': '方案三：CSS 混合模式',
    'Use CSS mix-blend-mode property to achieve similar transparent overlay effects.':
      '使用 CSS mix-blend-mode 属性实现类似的透明叠加效果。',
    'Normal Mode': '正常模式',
    'Screen Mode': '滤色模式',
    'Overlay Mode': '叠加模式',
    'Technical Implementation Points': '技术实现要点',
    ': Currently the most widely supported transparent video format, compatible with Chrome, Firefox, and Edge':
      '：目前兼容性最好的透明视频格式，Chrome、Firefox、Edge 均支持',
    'Video Encoding': '视频编码',
    ': Requires encoders that support alpha channels, such as VP9': '：需要支持 Alpha 通道的编码器，例如 VP9',
    'Canvas Processing': 'Canvas 处理',
    ': Can process video frame by frame for more complex transparency effects and interactions':
      '：可逐帧处理，实现更复杂的透明效果与交互',
    'CSS Blend Modes': 'CSS 混合模式',
    ': While not true transparency, can achieve visual overlay effects': '：并非真正的透明，但能实现视觉叠加效果',
    'Alternative Solutions': '替代方案',
    ": For browsers that don't support WebM, consider using APNG or GIF, but with lower quality":
      '：不支持的浏览器可考虑 APNG 或 GIF，但画质更低',
    'Note: Transparent background videos require specific video formats and encoding methods. Regular video formats do not support alpha channels.':
      '注意：透明背景视频需要特定的视频格式与编码方式，普通视频格式不支持 Alpha 通道。',
    'Transparent Background Video Playback Solutions Demo © 2023': '透明背景视频播放方案演示 © 2023',

    /* --- FFmpeg Script Tool (Next.js build) -------------------------- */
    'FFMPEG SCRIPT TOOL': 'FFMPEG 脚本工具',
    'Document': '文档',
    'DOWNLOAD FFMPEG': '下载 FFMPEG',
    'Video Split/Cut/Convert': '视频切割 / 裁剪 / 转换',
    'Slideshow': '幻灯片',
    'Image Crop': '图片裁剪',
    'Image Crop Tool': '图片裁剪工具',
    'Upload File': '上传文件',
    'Or drag and drop files here': '或将文件拖放到此处',
    'Upload Images': '上传图片',
    'Upload Image': '上传图片',
    'Trim Video': '裁剪视频',
    'Crop Details': '裁剪详情',
    'Apply Scale': '应用缩放',
    'Configure Slideshow': '配置幻灯片',
    'Copy to Clipboard': '复制到剪贴板',
    'Cropped': '已裁剪',
    'Cropped Image Preview': '裁剪结果预览',
    'Delete Intermediate Files': '删除中间文件',
    'Duration (seconds)': '时长（秒）',
    'Enable Palettegen': '启用调色板优化（palettegen）',
    'Enter output path': '输入输出路径',
    'Execute': '执行',
    'FFmpeg Command': 'FFmpeg 命令',
    'Height': '高度',
    'Width': '宽度',
    'Medium': '中等',
    'Quality': '质量',
    'Random': '随机',
    'Randomize Xfade Options': '随机化 Xfade 转场',
    'Run On Local': '在本机运行',
    'Scale (width)': '缩放（宽度）',
    'Scale Height': '缩放高度',
    'Scale Width': '缩放宽度',
    'Scaling might reduce definition': '缩放可能降低清晰度',
    'Set File Name And Output Dir.': '设置文件名与输出目录',
    'This is a generated script': '这是自动生成的脚本',
    'To be cropped': '待裁剪',
    'Update All Durations (seconds)': '批量更新时长（秒）',
    'Update All Fade Durations (seconds)': '批量更新淡入淡出时长（秒）',
    'Update All Xfade Effect': '批量更新 Xfade 转场',
    'Video Scale': '视频缩放',
    'Xfade Effect': 'Xfade 转场',
    'Output Directory': '输出目录',
    'Output File Name': '输出文件名',
    'Output Path': '输出路径'
  };

  /* ---------------------------------------------------------------- ZH → EN */
  var ZH_EN = {
    '⚡ 配置生成器 V5.0': '⚡ Config Generator V5.0',
    '1. 资源加载': '1. Asset loading',
    '2. 静态/边框配置': '2. Static / border settings',
    '3. 动画行为配置': '3. Animation behaviour',
    '本地文件': 'Local file',
    'URL 链接': 'URL',
    '链接': 'Link',
    '上传 CSS:': 'Upload CSS:',
    '预览图片 (可选):': 'Preview image (optional):',
    '注意：图片仅用于此处预览，导出代码不包含图片数据。':
      'Note: the image is used for preview only — exported code does not contain image data.',
    '加载 URL': 'Load URL',
    '静止边框色': 'Idle border colour',
    '静止边框宽 (px)': 'Idle border width (px)',
    '故障/霓虹色': 'Glitch / neon colour',
    '背景颜色': 'Background colour',
    '触发间隔 Min (ms)': 'Trigger interval min (ms)',
    '触发间隔 Max (ms)': 'Trigger interval max (ms)',
    '切换过程时长 (ms)': 'Transition duration (ms)',
    '故障概率 (Chaos %)': 'Glitch probability (chaos %)',
    '概率越高，触发红色严重故障的几率越大':
      'The higher the value, the more likely a heavy red glitch will trigger',
    '检测结果': 'Detection result',
    '生成并查看代码': 'Generate & view code',
    'Vue 组件代码 (Copy & Paste)': 'Vue component code (copy & paste)',
    '复制代码': 'Copy code',
    '代码已复制': 'Code copied',
    '关闭': 'Close',
    '请先加载 CSS': 'Please load a CSS file first',
    '等待 CSS...': 'Waiting for CSS...',
    '正常切换': 'Normal switch',
    '普通切换': 'Normal switch',
    '严重故障': 'Heavy glitch',
    '初始化': 'Initialising',
    '清理': 'Cleanup',
    '结束': 'Done'
  };

  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'label'];
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1, TEXTAREA: 1 };

  var currentLocale = null;
  var applying = false;
  var scheduled = false;
  var observer = null;

  function normalize(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function dictFor(locale) {
    return locale === 'zh' ? EN_ZH : ZH_EN;
  }

  // The pages are single-language, so the original string of every node we touch
  // is remembered: that is what lets us switch back (e.g. EN → ZH → EN) without
  // losing the source text.
  var originalText = new WeakMap();
  var originalAttrs = new WeakMap();
  var originalTitle = null;

  function desiredText(node, dict) {
    var current = node.nodeValue;
    if (!normalize(current)) {
      return null;
    }
    if (!originalText.has(node)) {
      originalText.set(node, current);
    }
    var original = originalText.get(node);
    var norm = normalize(original);
    var hit = dict[norm];
    if (hit == null || hit === norm) {
      return original;
    }
    var idx = original.indexOf(norm);
    if (idx === -1) {
      return original;
    }
    return original.slice(0, idx) + hit + original.slice(idx + norm.length);
  }

  function desiredAttr(el, attr, dict) {
    var value = el.getAttribute(attr);
    var store = originalAttrs.get(el);
    if (!store) {
      store = {};
      originalAttrs.set(el, store);
    }
    if (!(attr in store)) {
      store[attr] = value;
    }
    var original = store[attr];
    if (!original) {
      return null;
    }
    var norm = normalize(original);
    var hit = dict[norm];
    if (hit == null || hit === norm) {
      return original;
    }
    var idx = original.indexOf(norm);
    if (idx === -1) {
      return original;
    }
    return original.slice(0, idx) + hit + original.slice(idx + norm.length);
  }

  function detectLocale() {
    var fromQuery = null;
    try {
      fromQuery = new URLSearchParams(window.location.search).get('lang');
    }
    catch (e) {
      fromQuery = null;
    }
    if (fromQuery) {
      return fromQuery;
    }
    try {
      var raw = window.localStorage.getItem('locale');
      if (raw) {
        // The app stores it through vueuse (JSON encoded), tolerate plain values too.
        var parsed = raw;
        try {
          parsed = JSON.parse(raw);
        }
        catch (e) {
          parsed = String(raw).replace(/^"|"$/g, '');
        }
        if (typeof parsed === 'string' && parsed) {
          return parsed;
        }
      }
    }
    catch (e) {
      /* storage may be unavailable */
    }
    var nav = (navigator.language || 'en').toLowerCase();
    return nav.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function applyToDocument(doc, locale) {
    if (!doc || !doc.body) {
      return;
    }
    var dict = dictFor(locale);

    var walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
    var node = walker.nextNode();
    while (node) {
      var parent = node.parentNode;
      if (parent && !SKIP_TAGS[parent.nodeName]) {
        var wanted = desiredText(node, dict);
        if (wanted !== null && wanted !== node.nodeValue) {
          node.nodeValue = wanted;
        }
      }
      node = walker.nextNode();
    }

    var elements = doc.body.querySelectorAll('*');
    for (var i = 0; i < elements.length; i += 1) {
      var el = elements[i];
      if (SKIP_TAGS[el.nodeName]) {
        continue;
      }
      for (var a = 0; a < ATTRS.length; a += 1) {
        var attr = ATTRS[a];
        if (!el.hasAttribute(attr)) {
          continue;
        }
        var next = desiredAttr(el, attr, dict);
        if (next !== null && next !== el.getAttribute(attr)) {
          el.setAttribute(attr, next);
        }
      }
    }

    if (originalTitle === null) {
      originalTitle = doc.title;
    }
    var titleNorm = normalize(originalTitle);
    var titleHit = dict[titleNorm];
    doc.title = titleHit ? originalTitle.replace(titleNorm, titleHit) : originalTitle;
    doc.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale;
  }

  function apply(locale) {
    currentLocale = locale || currentLocale || detectLocale();
    if (applying) {
      return currentLocale;
    }
    applying = true;
    try {
      applyToDocument(document, currentLocale);
    }
    finally {
      applying = false;
    }
    return currentLocale;
  }

  function scheduleApply() {
    if (scheduled) {
      return;
    }
    scheduled = true;
    window.setTimeout(function () {
      scheduled = false;
      apply(currentLocale || detectLocale());
    }, 120);
  }

  function startObserver() {
    if (observer || !document.body || typeof MutationObserver === 'undefined') {
      return;
    }
    observer = new MutationObserver(function () {
      // Re-apply in the next tick; translation is idempotent so this settles
      // as soon as the re-rendered DOM is translated again.
      scheduleApply();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  window.__legacyI18n = {
    apply: apply,
    detect: detectLocale,
    get locale() {
      return currentLocale || detectLocale();
    }
  };

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (data && data.type === 'legacy-i18n' && data.locale) {
      apply(data.locale);
    }
  });

  function boot() {
    apply(detectLocale());
    startObserver();
    // Frameworks (Next.js hydration, deferred renders) may repaint later.
    window.setTimeout(function () {
      apply(currentLocale);
    }, 500);
    window.setTimeout(function () {
      apply(currentLocale);
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  }
  else {
    boot();
  }
})();
